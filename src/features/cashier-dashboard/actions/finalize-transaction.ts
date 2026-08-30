import { db } from "@/servers/db"
import { branchInventory, inventoryBatches, transactions } from "@/servers/schemas"
import { eq, and, asc, sql, gt } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"

/**
 * FIFO/FEFO stock deduction for a list of cart items.
 *
 * For each item it consumes existing inventory batches in order:
 *   - batches with an expiry date are sold first, oldest expiry first (FEFO)
 *   - batches without an expiry date are sold oldest-received first (FIFO)
 *   - expired batches are skipped (never sold to customers)
 *
 * If a product has positive branch inventory but no active batches (legacy
 * data restocked before batching), a single catch-all default batch is created
 * first so every unit of stock is always accounted for within the batch ledger.
 *
 * Runs inside a DB transaction so stock and batch deductions stay atomic.
 * No longer writes to the deprecated `products.quantity` column.
 */
export async function deductStock(branchId: string, items: { productId: string; quantity: number }[]) {
  await db.transaction(async (tx) => {
    for (const item of items) {
      const requested = item.quantity
      if (requested <= 0) continue

      const invRows = await tx
        .select()
        .from(branchInventory)
        .where(
          and(
            eq(branchInventory.branchId, branchId),
            eq(branchInventory.productId, item.productId),
          )
        )
        .limit(1)

      const inv = invRows[0]
      if (!inv || inv.quantity <= 0) continue

      // Backfill: ensure legacy stock that predates batching has a default batch.
      await ensureDefaultBatch(tx, inv.id, inv.quantity)

      // Active batches ordered FEFO first (expiry ASC, nulls last), then FIFO
      // (receivedDate ASC, createdAt ASC).
      const batches = await tx
        .select()
        .from(inventoryBatches)
        .where(and(eq(inventoryBatches.branchInventoryId, inv.id), gt(inventoryBatches.quantity, 0)))
        .orderBy(
          asc(inventoryBatches.expiryDate),
          asc(inventoryBatches.receivedDate),
          asc(inventoryBatches.createdAt),
        )

      let remaining = requested
      for (const batch of batches) {
        if (remaining <= 0) break
        // Skip expired batches (expiry in the past) - never sell expired stock.
        if (batch.expiryDate && new Date(batch.expiryDate) <= new Date()) continue

        const qty = Math.min(batch.quantity, remaining)
        remaining -= qty

        await tx
          .update(inventoryBatches)
          .set({ quantity: batch.quantity - qty })
          .where(eq(inventoryBatches.id, batch.id))
      }

      // Deduct the branch inventory barrel by the full requested amount,
      // clamped at zero.
      await tx
        .update(branchInventory)
        .set({
          quantity: sql`GREATEST(0, ${branchInventory.quantity} - ${requested})`,
        })
        .where(eq(branchInventory.id, inv.id))
    }
  })
}

/**
 * If a product has positive stock but no remaining active batches (stock that
 * was restocked before batching existed), create a single catch-all default
 * batch so the stock stays consistent with the batch ledger.
 */
async function ensureDefaultBatch(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  branchInventoryId: string,
  quantity: number
) {
  const active = await tx
    .select({ id: inventoryBatches.id })
    .from(inventoryBatches)
    .where(eq(inventoryBatches.branchInventoryId, branchInventoryId))
    .limit(1)

  if (active.length > 0 || quantity <= 0) return

  await tx.insert(inventoryBatches).values({
    id: generateId(),
    branchInventoryId,
    batchNumber: null,
    quantity,
    originalQuantity: quantity,
    expiryDate: null,
    supplier: null,
  })
}

/**
 * Complete a GCash transaction idempotently:
 *  1. Atomically flip status pending → completed (only one caller wins).
 *  2. If this call won the flip, deduct stock for the transaction's items.
 *
 * Safe to call from both the PayMongo webhook and the cashier
 * "Check Payment Status" route — whichever runs first deducts stock,
 * the second one is a no-op.
 */
export async function completeGcashTransaction(transactionId: string) {
  return db.transaction(async (tx) => {
    const flipped = await tx
      .update(transactions)
      .set({ status: "completed" })
      .where(and(eq(transactions.id, transactionId), eq(transactions.status, "pending")))
      .returning({ id: transactions.id })

    if (flipped.length === 0) {
      // Already completed — nothing to deduct (idempotent)
      return { completed: false, deducted: false }
    }

    const txn = await tx.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: { items: true },
    })

    if (!txn || txn.items.length === 0) {
      return { completed: true, deducted: false }
    }

    await deductStock(
      txn.branchId,
      txn.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    )

    return { completed: true, deducted: true }
  })
}
