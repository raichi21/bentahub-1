import { db } from "@/servers/db"
import { transactions, branches, transactionItems } from "@/servers/schemas"
import { eq, desc, inArray } from "drizzle-orm"
import type { StaffTransactionItem } from "@/types/staff"

interface RawTransaction {
  id: string
  branchId: string
  totalAmount: string
  paymentMethod: "cash" | "gcash"
  status: "completed" | "pending" | "cancelled"
  createdAt: Date
}

interface RawTransactionItem {
  transactionId: string
  productName: string
  quantity: number
  price: string
  subtotal: string
}

export async function getTransactions(branchName: string): Promise<StaffTransactionItem[]> {
  const branchRecord = await db.query.branches.findFirst({
    where: eq(branches.name, branchName),
  })

  if (!branchRecord) {
    throw new Error(`Branch "${branchName}" not found`)
  }

  const branchId = branchRecord.id

  const allTransactions = await db.query.transactions.findMany({
    where: eq(transactions.branchId, branchId),
    orderBy: desc(transactions.createdAt),
  }) as RawTransaction[]

  const transactionIds = allTransactions.map((t) => t.id)

  const allItems = transactionIds.length > 0
    ? await db.query.transactionItems.findMany({
        where: inArray(transactionItems.transactionId, transactionIds),
      }) as RawTransactionItem[]
    : []

  const itemsByTxnId = new Map<string, RawTransactionItem[]>()
  for (const item of allItems) {
    const list = itemsByTxnId.get(item.transactionId)
    if (list) list.push(item)
    else itemsByTxnId.set(item.transactionId, [item])
  }

  return allTransactions.map((t) => {
    const txnItems = itemsByTxnId.get(t.id) || []
    return {
      id: t.id,
      date: t.createdAt.toISOString(),
      paymentMethod: t.paymentMethod,
      total: parseFloat(t.totalAmount),
      status: t.status === "cancelled" ? "cancelled" : t.status,
      items: txnItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    }
  })
}
