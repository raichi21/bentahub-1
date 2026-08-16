import { NextRequest, NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { cartItems, branches, branchInventory } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"
import { getUserIdFromToken } from "@/lib/auth-utils"
import { clampCartQuantity, validateCartQuantity } from "@/lib/cart"

/**
 * PUT /api/customer/cart/[itemId]
 * Update cart item quantity
 * Body: { quantity: number }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = await params
    const body = await request.json()
    const { quantity } = body

    const cappedQuantity = clampCartQuantity(quantity)
    if (cappedQuantity === null) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      )
    }

    // Load the user's own cart row together with its current branch stock
    // so the new quantity can be validated before it is written.
    const rows = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        branch: cartItems.branch,
        stockQuantity: branchInventory.quantity,
      })
      .from(cartItems)
      .leftJoin(branches, eq(branches.name, cartItems.branch))
      .leftJoin(
        branchInventory,
        and(
          eq(branchInventory.productId, cartItems.productId),
          eq(branchInventory.branchId, branches.id)
        )
      )
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        )
      )
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      )
    }

    const row = rows[0]
    const availableStock =
      row.stockQuantity === null || row.stockQuantity === undefined
        ? null
        : Number(row.stockQuantity)
    const stockError = validateCartQuantity(cappedQuantity, availableStock)
    if (stockError) {
      return NextResponse.json(
        { success: false, message: stockError },
        { status: 400 }
      )
    }

    // Ownership is enforced by the WHERE clause itself: only the user's own
    // row can be updated.
    const updated = await db
      .update(cartItems)
      .set({
        quantity: cappedQuantity,
        subtotal: sql`(${cartItems.price} * ${cappedQuantity})::numeric(10, 2)`,
      })
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        )
      )
      .returning()

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item updated",
        data: updated[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update cart item" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer/cart/[itemId]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = await params

    // Ownership is enforced by the WHERE clause itself: only the user's own
    // row can be deleted. No separate pre-SELECT needed — one query total.
    const deleted = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        )
      )
      .returning({ id: cartItems.id })

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item removed",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return NextResponse.json(
      { success: false, message: "Failed to remove cart item" },
      { status: 500 }
    )
  }
}
