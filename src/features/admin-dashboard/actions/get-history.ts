import { db } from "@/servers/db"
import { transactions, branches, transactionItems } from "@/servers/schemas"
import { eq, and, gte, lte, desc } from "drizzle-orm"

export interface HistoryFilterOptions {
  dateFrom?: string
  dateTo?: string
  branchId?: string
  method?: string
  status?: string
  search?: string
  page: number
  pageSize: number
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export async function getHistory(filters: HistoryFilterOptions = { page: 1, pageSize: 15 }) {
  const allBranches = await db.query.branches.findMany()
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))

  const baseConditions: any[] = []
  if (filters.dateFrom) {
    baseConditions.push(gte(transactions.createdAt, new Date(filters.dateFrom)))
  }
  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    baseConditions.push(lte(transactions.createdAt, endDate))
  }
  if (filters.branchId) {
    baseConditions.push(eq(transactions.branchId, filters.branchId))
  }
  if (filters.method) {
    baseConditions.push(eq(transactions.paymentMethod, filters.method as any))
  }
  if (filters.status) {
    baseConditions.push(eq(transactions.status, filters.status as any))
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const allRows = await db.query.transactions.findMany({
    where,
    orderBy: [desc(transactions.createdAt)],
  }) as Array<{
    id: string; branchId: string; totalAmount: string; paymentMethod: string; status: string; createdAt: Date
  }>

  const allItems = await db.query.transactionItems.findMany() as Array<{
    id: string; transactionId: string; productId: string; productName: string
    quantity: number; price: string; subtotal: string; createdAt: Date
  }>

  const itemsByTxnId = new Map<string, typeof allItems>()
  for (const item of allItems) {
    const list = itemsByTxnId.get(item.transactionId)
    if (list) list.push(item)
    else itemsByTxnId.set(item.transactionId, [item])
  }

  let filtered = allRows
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = allRows.filter((t) =>
      t.id.toLowerCase().includes(q) ||
      (branchMap.get(t.branchId) || "").toLowerCase().includes(q)
    )
  }

  const totalCount = filtered.length
  const totalSales = filtered.reduce((sum, t) => sum + Number(t.totalAmount), 0)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = filtered.filter((t) => t.createdAt >= weekAgo)
  const lastWeek = filtered.filter((t) => t.createdAt >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && t.createdAt < weekAgo)
  const thisWeekSales = thisWeek.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const lastWeekSales = lastWeek.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  let trend = "0%"
  if (lastWeekSales > 0) {
    const pct = ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100
    trend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  } else if (thisWeekSales > 0) {
    trend = "+100%"
  }

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = filtered.slice(offset, offset + filters.pageSize)

  const transactionsList = pageRows.map((t, idx) => {
    const txnItems = itemsByTxnId.get(t.id) || []
    const subtotal = txnItems.reduce((s, item) => s + Number(item.subtotal), 0)
    const total = Number(t.totalAmount)
    return {
      id: t.id,
      displayId: `HST-${String(totalCount - offset - idx).padStart(5, "0")}`,
      date: t.createdAt,
      dateDisplay: formatDate(t.createdAt),
      branchName: branchMap.get(t.branchId) || "Unknown",
      itemsCount: txnItems.length,
      items: txnItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
      subtotal,
      subtotalDisplay: formatCurrency(subtotal),
      totalAmount: total,
      totalAmountDisplay: formatCurrency(total),
      paymentMethod: t.paymentMethod,
      paymentMethodDisplay: t.paymentMethod === "cash" ? "CASH" : "GCASH",
      status: t.status,
      statusDisplay: t.status === "completed" ? "Completed" : t.status === "pending" ? "Pending" : "Cancelled",
    }
  })

  return {
    metrics: {
      totalTransactions: totalCount,
      totalTransactionsDisplay: totalCount.toLocaleString(),
      totalSales,
      totalSalesDisplay: formatCurrency(totalSales),
      trend,
    },
    transactions: transactionsList,
    totalCount,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
  }
}
