import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, products, branchInventory, inventoryBatches, notifications, categories, unitTypes } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"

const SKU_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Build a random 4-char suffix and prefix it with the category code. */
function generateSku(code: string): string {
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += SKU_SUFFIX_CHARS[Math.floor(Math.random() * SKU_SUFFIX_CHARS.length)]
  }
  const prefix = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "GEN"
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
    const { productId, stock, reorderLevel, batchNumber, expiryDate, supplier, unit } = body

    if (!productId || stock === undefined) {
      return NextResponse.json({ success: false, message: "productId and stock are required" }, { status: 400 })
    }

    const stockQty = Math.max(0, stock)

    // Optional unit change — must exist in the master unit types table.
    if (unit !== undefined && typeof unit === "string" && unit.trim()) {
      const unitType = await db.query.unitTypes.findFirst({
        where: sql`lower(${unitTypes.name}) = lower(${unit.trim()})`,
      })
      if (!unitType) {
        return NextResponse.json({ success: false, message: "Unit not recognized. Please select an existing unit." }, { status: 400 })
      }
      await db.update(products)
        .set({ unit: unitType.name })
        .where(eq(products.id, productId))
    }

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
    const { name, category, stock, reorderLevel, price, image, batchNumber, expiryDate, supplier, barcode, unit } = body

    if (!name || !category || price === undefined) {
      return NextResponse.json({ success: false, message: "name, category, and price are required" }, { status: 400 })
    }

    // Category must exist in the master categories table (staff can pick from
    // existing categories but can no longer invent free-text ones).
    const categoryRecord = await db.query.categories.findFirst({
      where: sql`lower(${categories.name}) = lower(${category})`,
    })
    if (!categoryRecord) {
      return NextResponse.json({ success: false, message: "Category not recognized. Please select an existing category." }, { status: 400 })
    }

    // Unit must exist in the master unit types table.
    const unitValue = typeof unit === "string" && unit.trim() ? unit.trim() : "pcs"
    const unitRecord = await db.query.unitTypes.findFirst({
      where: sql`lower(${unitTypes.name}) = lower(${unitValue})`,
    })
    if (!unitRecord) {
      return NextResponse.json({ success: false, message: "Unit not recognized. Please select an existing unit." }, { status: 400 })
    }

    const productId = generateId()
    const sku = generateSku(categoryRecord.code)
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
      category: categoryRecord.name,
      price: price.toString(),
      unit: unitRecord.name,
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
        supplier: typeof supplier === "string" && supplier.trim() ? supplier.trim() : null,
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
