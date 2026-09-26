import { NextRequest, NextResponse } from "next/server"
import { requirePermission, generateId } from "@/lib/auth-utils"
import { logActivity } from "@/lib/activity-log"
import { db } from "@/servers/db"
import {
  users,
  branches,
  products,
  branchInventory,
  inventoryBatches,
  stockWasteLogs,
} from "@/servers/schemas"
import { eq, and, asc, gt } from "drizzle-orm"

const WASTE_REASONS = ["damaged", "expired", "lost", "other"] as const
type WasteReason = (typeof WASTE_REASONS)[number]

/**
 * POST /api/staff/waste
 * Report damaged/expired/lost stock. Deducts branch inventory and consumes
 * batches (expired batches first when the reason is expired, otherwise the
 * same FEFO/FIFO order as sales), records a waste log row, and emits an
 * activity log entry. All writes run in one DB transaction.
 * Body: { productId: string, quantity: number, reason: WasteReason, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "canManageProducts")
    if (auth.error) return auth.error

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { productId, quantity, reason, notes } = body as {
      productId?: unknown
      quantity?: unknown
      reason?: unknown
      notes?: unknown
    }

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { success: false, message: "productId is required" },
        { status: 400 }
      )
    }
    const wasteQty =
      typeof quantity === "number"
        ? Math.floor(quantity)
        : parseInt(String(quantity ?? ""), 10)
    if (!Number.isFinite(wasteQty) || wasteQty < 1) {
      return NextResponse.json(
        { success: false, message: "Quantity must be at least 1" },
        { status: 400 }
      )
    }
    if (
      typeof reason !== "string" ||
      !(WASTE_REASONS as readonly string[]).includes(reason)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Reason must be one of: damaged, expired, lost, other",
        },
        { status: 400 }
      )
    }
    const wasteReason = reason as WasteReason
    const noteText =
      typeof notes === "string" && notes.trim() ? notes.trim() : null

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    const invRows = await db
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, branchRecord.id),
          eq(branchInventory.productId, productId)
        )
      )
      .limit(1)
    const inv = invRows[0]
    if (!inv) {
      return NextResponse.json(
        { success: false, message: "Product inventory not found" },
        { status: 404 }
      )
    }
    if (wasteQty > inv.quantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot waste more than current stock (${inv.quantity} ${product.unit})`,
        },
        { status: 400 }
      )
    }

    const newStock = inv.quantity - wasteQty

    await db.transaction(async (tx) => {
      const batches = await tx
        .select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.branchInventoryId, inv.id),
            gt(inventoryBatches.quantity, 0)
          )
        )
        .orderBy(
          asc(inventoryBatches.expiryDate),
          asc(inventoryBatches.receivedDate),
          asc(inventoryBatches.createdAt)
        )

      // Expired waste clears expired batches first; other reasons follow
      // the same FEFO/FIFO order as sales (expired batches are saleable
      // nowhere, so they are skipped unless being wasted as expired).
      const now = new Date()
      const ordered =
        wasteReason === "expired"
          ? [
              ...batches.filter(
                (b) => b.expiryDate && new Date(b.expiryDate) <= now
              ),
              ...batches.filter(
                (b) => !b.expiryDate || new Date(b.expiryDate) > now
              ),
            ]
          : batches.filter((b) => !b.expiryDate || new Date(b.expiryDate) > now)

      let remaining = wasteQty
      for (const batch of ordered) {
        if (remaining <= 0) break
        const qty = Math.min(batch.quantity, remaining)
        remaining -= qty
        await tx
          .update(inventoryBatches)
          .set({ quantity: batch.quantity - qty })
          .where(eq(inventoryBatches.id, batch.id))
      }

      await tx
        .update(branchInventory)
        .set({ quantity: newStock })
        .where(eq(branchInventory.id, inv.id))

      await tx.insert(stockWasteLogs).values({
        id: generateId(),
        productId,
        productName: product.name,
        branch: branchName,
        quantity: wasteQty,
        unit: product.unit,
        reason: wasteReason,
        notes: noteText,
        reportedBy: auth.userId,
      })
    })

    logActivity({
      actorId: auth.userId,
      action: "stock.waste",
      entity: "product",
      entityId: productId,
      entityName: product.name,
      details: {
        quantity: wasteQty,
        unit: product.unit,
        reason: wasteReason,
        ...(noteText ? { notes: noteText } : {}),
        branch: branchName,
      },
      branch: branchName,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Waste reported successfully",
        data: { newStock },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Staff waste POST error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while reporting waste" },
      { status: 500 }
    )
  }
}
