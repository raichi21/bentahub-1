import { db } from "@/servers/db"
import {
  branchInventory,
  cashDrawerSessions,
  inventoryBatches,
  transactions,
  products,
} from "@/servers/schemas"
import {
  eq,
  and,
  asc,
  sql,
  gt,
  inArray,
  type SQL,
  type SQLWrapper,
} from "drizzle-orm"
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
 * Build a single-column UPDATE expression that applies a different value per
 * row, keyed by id:
 *
 *   CASE <idColumn> WHEN <id1> THEN <value1> WHEN <id2> THEN <value2> ... END
 *
 * The id column MUST be the CASE base expression. Writing `CASE WHEN <id>` is
 * wrong: `<id>` becomes a bound string parameter used as a boolean condition,
 * so Postgres evaluates it false for every row and silently falls through to
 * ELSE — the update becomes a no-op with no error.
 */
export function buildIdCase(
  idColumn: SQLWrapper,
  elseValue: SQLWrapper,
  valuesById: Map<string, SQL>
): SQL {
  return sql`CASE ${idColumn} ${sql.join(
    [...valuesById].map(([id, value]) => sql`WHEN ${id} THEN ${value}`),
    sql` `
  )} ELSE ${elseValue} END`
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
  const productIds = items
    .map((i) => i.productId)
    .filter((id) => id && items.find((i) => i.productId === id && i.quantity > 0))
  if (productIds.length === 0) return

  const allInv = await tx
    .select()
    .from(branchInventory)
    .where(
      and(
        eq(branchInventory.branchId, branchId),
        inArray(branchInventory.productId, productIds)
      )
    )
  if (allInv.length === 0) {
    throw new InsufficientStockError(productIds[0], 1, 0)
  }

  const invByProduct = new Map(allInv.map((i) => [i.productId, i]))

  const allBatches = await tx
    .select()
    .from(inventoryBatches)
    .where(
      and(
        inArray(
          inventoryBatches.branchInventoryId,
          allInv.map((i) => i.id)
        ),
        gt(inventoryBatches.quantity, 0)
      )
    )
    .orderBy(
      asc(inventoryBatches.expiryDate),
      asc(inventoryBatches.receivedDate),
      asc(inventoryBatches.createdAt)
    )

  const batchesByInv = new Map<string, typeof allBatches>()
  for (const inv of allInv) {
    batchesByInv.set(inv.id, [])
  }
  for (const batch of allBatches) {
    batchesByInv.get(batch.branchInventoryId)?.push(batch)
  }

  const now = Date.now()
  const batchUpdates = new Map<string, number>()
  const invUpdates = new Map<string, number>()

  for (const item of items) {
    const requested = item.quantity
    if (requested <= 0) continue

    const inv = invByProduct.get(item.productId)
    if (!inv || inv.quantity <= 0) {
      throw new InsufficientStockError(item.productId, requested, inv?.quantity ?? 0)
    }

    const batches = batchesByInv.get(inv.id) ?? []
    const activeBatches = batches.filter(
      (b) => !b.expiryDate || b.expiryDate.getTime() > now
    )

    const activeTotal = activeBatches.reduce((sum, b) => sum + b.quantity, 0)
    // If the batch ledger is short of branchInventory (e.g. unbatched stock),
    // synthesize a catch-all batch so stock can be deducted properly.
    if (activeTotal < requested && inv.quantity >= requested) {
      const missingQty = inv.quantity - activeTotal
      const fallbackBatchId = generateId()
      await tx.insert(inventoryBatches).values({
        id: fallbackBatchId,
        branchInventoryId: inv.id,
        batchNumber: "DEFAULT",
        quantity: missingQty,
        originalQuantity: missingQty,
        expiryDate: null,
        supplier: null,
      })
      activeBatches.push({
        id: fallbackBatchId,
        branchInventoryId: inv.id,
        batchNumber: "DEFAULT",
        quantity: missingQty,
        originalQuantity: missingQty,
        expiryDate: null,
        receivedDate: new Date(),
        supplier: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    const { allocations, remaining } = allocateBatches(activeBatches, requested)

    if (remaining > 0) {
      throw new InsufficientStockError(
        item.productId,
        requested,
        requested - remaining
      )
    }

    if (allocations.length === 0) continue

    const consumed = allocations.reduce((sum, a) => sum + a.quantity, 0)
    for (const alloc of allocations) {
      batchUpdates.set(
        alloc.batchId,
        (batchUpdates.get(alloc.batchId) ?? 0) + alloc.quantity
      )
    }
    invUpdates.set(inv.id, consumed)
  }

  if (batchUpdates.size > 0) {
    const batchIds = [...batchUpdates.keys()]
    await tx
      .update(inventoryBatches)
      .set({
        quantity: buildIdCase(
          inventoryBatches.id,
          inventoryBatches.quantity,
          new Map(
            batchIds.map((id) => [
              id,
              sql`${inventoryBatches.quantity} - ${batchUpdates.get(id)}`,
            ])
          )
        ),
      })
      .where(inArray(inventoryBatches.id, batchIds))
  }

  if (invUpdates.size > 0) {
    const invIds = [...invUpdates.keys()]
    await tx
      .update(branchInventory)
      .set({
        quantity: buildIdCase(
          branchInventory.id,
          branchInventory.quantity,
          new Map(
            invIds.map((id) => [
              id,
              sql`${branchInventory.quantity} - ${invUpdates.get(id)}`,
            ])
          )
        ),
      })
      .where(inArray(branchInventory.id, invIds))
  }

  // Keep products.quantity in sync with branchInventory
  const prodUpdates = new Map<string, number>()
  for (const item of items) {
    if (item.quantity > 0) {
      prodUpdates.set(
        item.productId,
        (prodUpdates.get(item.productId) ?? 0) + item.quantity
      )
    }
  }
  const prodIds = [...prodUpdates.keys()]
  if (prodIds.length > 0) {
    await tx
      .update(products)
      .set({
        quantity: buildIdCase(
          products.id,
          products.quantity,
          new Map(
            prodIds.map((id) => [
              id,
              sql`GREATEST(0, ${products.quantity} - ${prodUpdates.get(id)})`,
            ])
          )
        ),
      })
      .where(inArray(products.id, prodIds))
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
  const prodRestores = new Map<string, number>()
  for (const item of items) {
    const quantity = item.quantity
    if (quantity <= 0) continue

    prodRestores.set(
      item.productId,
      (prodRestores.get(item.productId) ?? 0) + quantity
    )

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

  const prodIds = [...prodRestores.keys()]
  if (prodIds.length > 0) {
    await tx
      .update(products)
      .set({
        quantity: buildIdCase(
          products.id,
          products.quantity,
          new Map(
            prodIds.map((id) => [
              id,
              sql`${products.quantity} + ${prodRestores.get(id)}`,
            ])
          )
        ),
      })
      .where(inArray(products.id, prodIds))
  }
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
