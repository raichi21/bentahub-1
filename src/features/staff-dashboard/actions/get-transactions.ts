import { db } from "@/servers/db"
import { transactions, branches } from "@/servers/schemas"
import { eq, desc } from "drizzle-orm"
import type { StaffTransactionItem } from "@/types/staff"

interface RawTransaction {
  id: string
  branchId: string
  totalAmount: string
  paymentMethod: "cash" | "gcash"
  status: "completed" | "pending" | "cancelled"
  createdAt: Date
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

  return allTransactions.map((t) => ({
    id: t.id,
    date: t.createdAt.toISOString(),
    paymentMethod: t.paymentMethod,
    total: parseFloat(t.totalAmount),
    status: t.status === "cancelled" ? "cancelled" : t.status,
  }))
}
