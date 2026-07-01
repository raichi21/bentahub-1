import { db } from "@/servers/db"
import { transactions, branches } from "@/servers/schemas"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export interface SalesOverview {
  totalSales: number
  totalSalesDisplay: string
  transactionCount: number
  avgPerTransaction: number
  avgPerTransactionDisplay: string
  trend: string
}

export interface SalesTransactionRow {
  id: string
  displayId: string
  branchName: string
  createdAt: Date
  totalAmount: string
  paymentMethod: string
  status: string
}

export interface SalesTrendPoint {
  month: string
  revenue: number
}

export interface SalesFilterOptions {
  dateFrom?: string
  dateTo?: string
  branchId?: string
  page: number
  pageSize: number
}

export interface SalesPageData {
  overview: SalesOverview
  transactions: SalesTransactionRow[]
  totalCount: number
  branches: { id: string; name: string }[]
  salesTrend: SalesTrendPoint[]
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function getSalesData(filters: SalesFilterOptions = { page: 1, pageSize: 15 }): Promise<SalesPageData> {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const allBranches = await db.query.branches.findMany()

  const baseConditions = [eq(transactions.status, "completed")]
  if (filters.branchId) {
    baseConditions.push(eq(transactions.branchId, filters.branchId))
  }
  if (filters.dateFrom) {
    baseConditions.push(gte(transactions.createdAt, new Date(filters.dateFrom)))
  }
  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    baseConditions.push(lte(transactions.createdAt, endDate))
  }

  const where = and(...baseConditions)

  const allMatched = await db.query.transactions.findMany({
    where,
    orderBy: [desc(transactions.createdAt)],
  }) as Array<{
    id: string; branchId: string; totalAmount: string; paymentMethod: string; status: string; createdAt: Date
  }>

  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))

  const totalSales = allMatched.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
  const transactionCount = allMatched.length
  const avgPerTransaction = transactionCount > 0 ? totalSales / transactionCount : 0

  const currentMonthRevenue = allMatched
    .filter((t) => t.createdAt >= currentMonthStart)
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
  const lastMonthRevenue = allMatched
    .filter((t) => t.createdAt >= lastMonthStart && t.createdAt < currentMonthStart)
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)

  let trend = "0%"
  if (lastMonthRevenue > 0) {
    const pct = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    trend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  } else if (currentMonthRevenue > 0) {
    trend = "+100%"
  }

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = allMatched.slice(offset, offset + filters.pageSize)
  const transactionsList: SalesTransactionRow[] = pageRows.map((t, idx) => ({
    id: t.id,
    displayId: `BH-${String(allMatched.length - offset - idx).padStart(4, "0")}`,
    branchName: branchMap.get(t.branchId) || "Unknown",
    createdAt: t.createdAt,
    totalAmount: t.totalAmount,
    paymentMethod: t.paymentMethod,
    status: t.status,
  }))

  const salesTrend: SalesTrendPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = i === 0
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const revenue = allMatched
      .filter((t) => t.createdAt >= start && t.createdAt <= end)
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
    salesTrend.push({
      month: MONTH_NAMES[start.getMonth()],
      revenue,
    })
  }

  return {
    overview: {
      totalSales,
      totalSalesDisplay: formatCurrency(totalSales),
      transactionCount,
      avgPerTransaction,
      avgPerTransactionDisplay: formatCurrency(avgPerTransaction),
      trend,
    },
    transactions: transactionsList,
    totalCount: allMatched.length,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
    salesTrend,
  }
}
