import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { cartItems, products, branches, branchInventory } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"
import { generateId, extractToken, verifyToken } from "@/lib/auth-utils"

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = extractToken(request)

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  return decoded.userId
}

/**
 * GET /api/customer/cart
 * Retrieve all cart items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))

    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          itemCount,
          total: Number(total.toFixed(2)),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching cart:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customer/cart
 * Add a product to the cart
 * Body: { productId: string, quantity: number, branch: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity, branch } = body

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid product ID or quantity" },
        { status: 400 }
      )
    }

    // Single read query: product + existing cart row (left join on userId)
    // + per-branch stock (when a branch is provided).
    // When no branch is given, the branch join matches nothing (sql`false`)
    // so stock fields resolve to null and stock validation is skipped.
    const branchCondition = branch
      ? eq(branches.name, branch)
      : sql`false`

    // Run both reads in parallel — neither depends on the other, and both
    // only need userId/productId/branch which are known up front.
    const [rows, existingBranches] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          image: products.image,
          category: products.category,
          isActive: products.isActive,
          productBranch: products.branch,
          cartId: cartItems.id,
          cartQuantity: cartItems.quantity,
          cartBranch: cartItems.branch,
          stockQuantity: branchInventory.quantity,
        })
        .from(products)
        .leftJoin(
          cartItems,
          and(
            eq(cartItems.productId, products.id),
            eq(cartItems.userId, userId)
          )
        )
        .leftJoin(branches, branchCondition)
        .leftJoin(
          branchInventory,
          and(
            eq(branchInventory.productId, products.id),
            eq(branchInventory.branchId, branches.id)
          )
        )
        .where(eq(products.id, productId))
        .limit(1),
      db
        .selectDistinct({ branch: cartItems.branch })
        .from(cartItems)
        .where(eq(cartItems.userId, userId)),
    ])

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    const row = rows[0]

    if (row.isActive === false) {
      return NextResponse.json(
        { success: false, message: "Product is not available" },
        { status: 404 }
      )
    }

    const unitPrice = Number(row.price)
    const existingQuantity = row.cartId ? Number(row.cartQuantity) : 0
    const newQuantity = existingQuantity + quantity
    const effectiveBranch = branch || row.productBranch

    // Stock validation (only when the requested branch resolves)
    if (row.stockQuantity !== null && row.stockQuantity !== undefined) {
      const available = Number(row.stockQuantity)
      if (available <= 0) {
        return NextResponse.json(
          { success: false, message: "This product is out of stock at the selected branch" },
          { status: 400 }
        )
      }
      if (newQuantity > available) {
        return NextResponse.json(
          { success: false, message: `Only ${available} item(s) available at the selected branch` },
          { status: 400 }
        )
      }
    }

    if (row.cartId) {
      // Keep carts single-branch: reject re-adding the same product for a different branch
      if (effectiveBranch && row.cartBranch && row.cartBranch !== effectiveBranch) {
        return NextResponse.json(
          {
            success: false,
            message: `This item is already in your cart for ${row.cartBranch}. Please finish that reservation first.`,
          },
          { status: 400 }
        )
      }

      const updated = await db
        .update(cartItems)
        .set({
          quantity: newQuantity,
          subtotal: (unitPrice * newQuantity).toFixed(2),
        })
        .where(eq(cartItems.id, row.cartId))
        .returning()

      return NextResponse.json(
        {
          success: true,
          message: "Cart item updated",
          data: updated[0],
        },
        { status: 200 }
      )
    }

    // Single-branch cart: reject a new item from a different branch
    if (effectiveBranch) {
      if (
        existingBranches.length > 0 &&
        existingBranches.some((b) => b.branch !== effectiveBranch)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Your cart already has items from ${existingBranches[0].branch}. Please finish that reservation before ordering from another branch.`,
          },
          { status: 400 }
        )
      }
    }

    // Add new item to cart
    const newCartItem = {
      id: generateId(),
      userId,
      productId,
      productName: row.name,
      price: row.price.toString(),
      quantity,
      subtotal: (unitPrice * quantity).toFixed(2),
      image: row.image || "",
      category: row.category,
      branch: effectiveBranch,
    }

    const created = await db.insert(cartItems).values(newCartItem).returning()

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart",
        data: created[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error adding to cart:", error)
    return NextResponse.json(
      { success: false, message: "Failed to add item to cart" },
      { status: 500 }
    )
  }
}
