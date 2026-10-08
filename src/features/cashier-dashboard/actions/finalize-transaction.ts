import { db } from "@/servers/db"
import {
  branchInventory,
  cashDrawerSessions,
  inventoryBatches,
  transactions,
} from "@/servers/schemas"
import { eq, and, asc, sql, gt } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"

/** Raised when a product's available stock cannot cover the requested amount. */
export class InsufficientStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: need ${requested}, available ${available}`
    )
    this.name = "InsufficientStockError"
  }
}

export interface BatchAllocation {
  batchId: string
  quantity: number
}

/**
 * Pure FEFO/FIFO allocator: consumes the given batches (already ordered oldest
 * expiry first) until `requested` units are covered. Expired batches are
 * skipped. Returns what was allocated per batch plus any remaining shortfall.
 */
export function allocateBatches(
  batches: Array<{
    id: string
    quantity: number
    expiryDate: Date | null
  }>,
  requested: number
): { allocations: BatchAllocation[]; remaining: number } {
  let remaining = requested
  const allocations: BatchAllocation[] = []
  for (const batch of batches) {
    if (remaining <= 0) break
    // Skip expired batches (expiry in the past) - never sell expired stock.
    if (batch.expiryDate && new Date(batch.expiryDate) <= new Date()) continue
    const qty = Math.min(batch.quantity, remaining)
    remaining -= qty
    allocations.push({ batchId: batch.id, quantity: qty })
  }
  return { allocations, remaining }
}

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
 *
 * Throws `InsufficientStockError` when any line cannot be fully fulfilled —
 * the caller's transaction (or this function's own) rolls back, so a sale is
 * never partially stocked.
 */
export async function deductStock(
  branchId: string,
  items: { productId: string; quantity: number }[]
) {
  await db.transaction(async (tx) => {
    await deductStockIn(tx, branchId, items)
  })
}

/**
 * Transaction-scoped variant of `deductStock`. Run this from inside an
 * existing `db.transaction` so the status flip and the stock deduction commit
 * together (no split between two independent transactions).
 */
export async function deductStockIn(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  branchId: string,
  items: { productId: string; quantity: number }[]
) {
  for (const item of items) {
    const requested = item.quantity
    if (requested <= 0) continue

    const invRows = await tx
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          eq(branchInventory.productId, item.productId)
        )
      )
      .limit(1)

    const inv = invRows[0]
    if (!inv || inv.quantity <= 0) {
      throw new InsufficientStockError(
        item.productId,
        requested,
        inv?.quantity ?? 0
      )
    }

    // Backfill: ensure legacy stock that predates batching has a default batch.
    await ensureDefaultBatch(tx, inv.id, inv.quantity)

    // Active batches ordered FEFO first (expiry ASC, nulls last), then FIFO
    // (receivedDate ASC, createdAt ASC).
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

    // Allocate FEFO first (expiry ASC, nulls last), then FIFO (receivedDate
    // ASC, createdAt ASC) — batches are returned from SQL already ordered.
    const { allocations, remaining } = allocateBatches(batches, requested)

    for (const allocation of allocations) {
      await tx
        .update(inventoryBatches)
        .set({
          quantity: sql`${inventoryBatches.quantity} - ${allocation.quantity}`,
        })
        .where(eq(inventoryBatches.id, allocation.batchId))
    }

    // Never partially fulfill: if any demand is left unsatisfied, roll back
    // the whole deduction (the enclosing transaction aborts).
    if (remaining > 0) {
      throw new InsufficientStockError(
        item.productId,
        requested,
        requested - remaining
      )
    }

    // Deduct the branch inventory barrel by the amount actually consumed
    // (== requested on success), keeping the barrel in sync with the ledger.
    if (allocations.length > 0) {
      const consumed = allocations.reduce((sum, a) => sum + a.quantity, 0)
      await tx
        .update(branchInventory)
        .set({
          quantity: sql`${branchInventory.quantity} - ${consumed}`,
        })
        .where(eq(branchInventory.id, inv.id))
    }
  }
}

/**
 * Transaction-scoped inverse of `deductStockIn`. Returns committed stock back
 * to a branch when a reservation is cancelled after stock was reserved.
 *
 * Per item: increments the branch inventory barrel and appends a fresh batch
 * row to the batch ledger so the ledger always balances with the barrel.
 * Missing inventory rows are skipped — nothing was deducted there, so there
 * is nothing to restore.
 *
 * Must run inside the same transaction as the status flip so the cancel and
 * the stock return commit atomically.
 */
export async function restoreStockIn(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  branchId: string,
  items: { productId: string; quantity: number }[]
) {
  for (const item of items) {
    const quantity = item.quantity
    if (quantity <= 0) continue

    const invRows = await tx
      .select()
      .from(branchInventory)
      .where(
        and(
          eq(branchInventory.branchId, branchId),
          eq(branchInventory.productId, item.productId)
        )
      )
      .limit(1)

    const inv = invRows[0]
    if (!inv) continue

    await tx
      .update(branchInventory)
      .set({
        quantity: sql`${branchInventory.quantity} + ${quantity}`,
      })
      .where(eq(branchInventory.id, inv.id))

    await tx.insert(inventoryBatches).values({
      id: generateId(),
      branchInventoryId: inv.id,
      batchNumber: null,
      quantity,
      originalQuantity: quantity,
      expiryDate: null,
      supplier: null,
    })
  }
}

/**
 * If a product has positive stock but no batches with remaining quantity
 * (stock that was restocked before batching existed, or a batch ledger that
 * was fully consumed), create a single catch-all default batch so the stock
 * stays consistent with the batch ledger. The check must test for remaining
 * quantity — a completely exhausted legacy batch must not suppress backfill.
 */
async function ensureDefaultBatch(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  branchInventoryId: string,
  quantity: number
) {
  const active = await tx
    .select({ id: inventoryBatches.id })
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.branchInventoryId, branchInventoryId),
        gt(inventoryBatches.quantity, 0)
      )
    )
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
      .where(
        and(
          eq(transactions.id, transactionId),
          eq(transactions.status, "pending")
        )
      )
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

    // Belt-and-suspenders: rows created before the drawer requirement (or in
    // the race where the drawer opened after initiation) carry a NULL
    // sessionId, which would hide them from the shift's GCash total. Attach
    // the currently-open session now, in the same atomic transaction.
    // (A NULL cashierId means nobody can own a drawer session — skip.)
    if (!txn.sessionId && txn.cashierId) {
      const openSession = await tx.query.cashDrawerSessions.findFirst({
        where: and(
          eq(cashDrawerSessions.cashierId, txn.cashierId),
          eq(cashDrawerSessions.branchId, txn.branchId),
          eq(cashDrawerSessions.status, "open")
        ),
      })
      if (openSession) {
        await tx
          .update(transactions)
          .set({ sessionId: openSession.id })
          .where(eq(transactions.id, transactionId))
      }
    }

    // Deduct stock on the SAME transaction that flipped the status, so the
    // flip and the deduction commit atomically (no split transactions).
    await deductStockIn(
      tx,
      txn.branchId,
      txn.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    )

    return { completed: true, deducted: true }
  })
}
