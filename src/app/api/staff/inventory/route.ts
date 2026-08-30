import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, products, branchInventory, inventoryBatches, notifications } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"

const CATEGORY_SKU_PREFIX: Record<string, string> = {
  groceries: "GRC",
  beverages: "BVG",
  household: "HOU",
  pharmacy: "PHA",
  snacks: "SNK",
  bakery: "BAK",
}

function generateSku(category: string): string {
  const prefix = CATEGORY_SKU_PREFIX[category.toLowerCase()] || "GEN"
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${suffix}`
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")
    if (auth.error) {
      return auth.error
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const body = await request.json()
    const { productId, stock, reorderLevel, batchNumber, expiryDate, supplier } = body

    if (!productId || stock === undefined) {
      return NextResponse.json({ success: false, message: "productId and stock are required" }, { status: 400 })
    }

    const stockQty = Math.max(0, stock)

    // Fetch the current inventory row to compute the restock delta and to
    // ensure the product is registered in this branch.
    const existing = await db.query.branchInventory.findFirst({
      where: and(
        eq(branchInventory.branchId, branchRecord.id),
        eq(branchInventory.productId, productId),
      ),
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: "Product inventory not found" }, { status: 404 })
    }

    const currentQty = existing.quantity
    const delta = Math.max(0, stockQty - currentQty)

    await db
      .update(branchInventory)
      .set({
        quantity: stockQty,
        lowStockThreshold: reorderLevel !== undefined ? Math.max(0, reorderLevel) : undefined,
      })
      .where(
        and(
          eq(branchInventory.branchId, branchRecord.id),
          eq(branchInventory.productId, productId),
        )
      )

    // Additive restock: record the incoming stock as a new inventory batch so
    // the batch ledger stays consistent with branch_inventory. A positive delta
    // (restock / new delivery) creates a batch; otherwise it's just an
    // adjustment of quantity / reorder level.
    if (delta > 0) {
      await db.insert(inventoryBatches).values({
        id: generateId(),
        branchInventoryId: existing.id,
        batchNumber: batchNumber || null,
        quantity: delta,
        originalQuantity: delta,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier: supplier || null,
      })
    }

    return NextResponse.json({ success: true, message: "Stock updated successfully" })
  } catch (error) {
    console.error("Staff inventory PATCH error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while updating stock" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")
    if (auth.error) {
      return auth.error
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, category, stock, reorderLevel, price, image, batchNumber, expiryDate, barcode } = body

    if (!name || !category || price === undefined) {
      return NextResponse.json({ success: false, message: "name, category, and price are required" }, { status: 400 })
    }

    const productId = generateId()
    const sku = generateSku(category)
    const barcodeValue = barcode && typeof barcode === "string" && barcode.trim() ? barcode.trim() : null
    const stockQty = Math.max(0, stock || 0)
    const threshold = reorderLevel !== undefined ? Math.max(0, reorderLevel) : 10
    const stockStatus = stockQty === 0 ? "out-of-stock" : stockQty <= threshold ? "low-stock" : "in-stock"

    const productImage = image && typeof image === "string" ? image : null

    await db.insert(products).values({
      id: productId,
      name,
      description: null,
      sku,
      barcode: barcodeValue,
      category,
      price: price.toString(),
      image: productImage,
      quantity: stockQty,
      stockStatus,
      branch: branchName,
      isActive: true,
    })

    const branchInventoryId = generateId()
    await db.insert(branchInventory).values({
      id: branchInventoryId,
      branchId: branchRecord.id,
      productId,
      quantity: stockQty,
      lowStockThreshold: threshold,
    })

    if (stockQty > 0) {
      await db.insert(inventoryBatches).values({
        id: generateId(),
        branchInventoryId,
        batchNumber: batchNumber || null,
        quantity: stockQty,
        originalQuantity: stockQty,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier: null,
      })
    }

    const adminUsers = await db.query.users.findMany({
      where: and(eq(users.role, "admin"), eq(users.isActive, true)),
    })

    if (adminUsers.length > 0) {
      await db.insert(notifications).values(
        adminUsers.map((a) => ({
          id: generateId(),
          userId: a.id,
          type: "new-product" as const,
          title: `New Product Added: ${name}`,
          message: `${name} (SKU: ${sku}) was added to ${branchName} by ${user.fullName}. Price: ₱${price}.`,
          relatedProductId: productId,
          isRead: false,
          readAt: null,
          expiresAt: null,
          relatedOrderId: null,
        }))
      )
    }

    return NextResponse.json({ success: true, message: "Product added successfully", data: { id: productId, sku } })
  } catch (error) {
    console.error("Staff inventory POST error:", error)
    const message = error instanceof Error ? error.message : "An error occurred while adding product"
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    )
  }
}
