import { db } from "@/servers/db"
import { branchInventory, transactions } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"

/**
 * Deduct stock from branch inventory for a list of cart items.
 * Uses GREATEST(0, ...) so quantity can never go negative.
 */
export async function deductStock(branchId: string, items: { productId: string; quantity: number }[]) {
  for (const item of items) {
    await db
      .update(branchInventory)
      .set({
        quantity: sql`GREATEST(0, ${branchInventory.quantity} - ${item.quantity})`,
      })
      .where(
        sql`${branchInventory.branchId} = ${branchId} AND ${branchInventory.productId} = ${item.productId}`
      )
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
