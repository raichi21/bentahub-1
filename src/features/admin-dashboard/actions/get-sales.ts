import { db } from "@/servers/db"
import { transactions } from "@/servers/schemas"
import { eq, and, gte, lte, lt, desc, sql } from "drizzle-orm"

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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
  receiptNumber: number | null
  gcashRef: string | null
  cashierName: string | null
  items: Array<{
    productName: string
    quantity: number
    price: number
    subtotal: number
  }>
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

export async function getSalesData(
  filters: SalesFilterOptions = { page: 1, pageSize: 15 }
): Promise<SalesPageData> {
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

  // --- Aggregates (no row hydration: count/sum only) -----------------------
  const metricsQuery = db
    .select({
      n: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .where(where)
  const currentMonthQuery = db
    .select({
      total: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .where(and(where, gte(transactions.createdAt, currentMonthStart)))
  const lastMonthQuery = db
    .select({
      total: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        where,
        gte(transactions.createdAt, lastMonthStart),
        lt(transactions.createdAt, currentMonthStart)
      )
    )

  const monthBounds: Array<{ start: Date; end: Date }> = []
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end =
      i === 0
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    monthBounds.push({ start, end })
  }
  const trendQueries = monthBounds.map(({ start, end }) =>
    db
      .select({
        total: sql<string>`coalesce(sum(${transactions.totalAmount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          where,
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end)
        )
      )
  )

  const [metricRows, currentMonthRows, lastMonthRows, trendTotals] =
    await Promise.all([
      metricsQuery,
      currentMonthQuery,
      lastMonthQuery,
      Promise.all(trendQueries),
    ])

  const transactionCount = metricRows[0]?.n ?? 0
  const totalSales = parseFloat(metricRows[0]?.total ?? "0")
  const avgPerTransaction =
    transactionCount > 0 ? totalSales / transactionCount : 0

  const currentMonthRevenue = parseFloat(currentMonthRows[0]?.total ?? "0")
  const lastMonthRevenue = parseFloat(lastMonthRows[0]?.total ?? "0")

  let trend = "0%"
  if (lastMonthRevenue > 0) {
    const pct =
      ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    trend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  } else if (currentMonthRevenue > 0) {
    trend = "+100%"
  }

  // --- Page rows only (limit/offset, same join shape as before) ------------
  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = await db.query.transactions.findMany({
    where,
    orderBy: [desc(transactions.createdAt)],
    limit: filters.pageSize,
    offset,
    with: {
      items: true,
      cashier: {
        columns: { fullName: true },
      },
    },
  })

  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))

  const transactionsList: SalesTransactionRow[] = pageRows.map((t, idx) => ({
    id: t.id,
    displayId: `SAL-${String(transactionCount - offset - idx).padStart(4, "0")}`,
    branchName: branchMap.get(t.branchId) || "Unknown",
    createdAt: t.createdAt,
    totalAmount: t.totalAmount,
    paymentMethod: t.paymentMethod,
    status: t.status,
    receiptNumber: t.receiptNumber ?? null,
    gcashRef: t.gcashRef ?? null,
    cashierName: t.cashier?.fullName ?? null,
    items: (t.items || []).map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      price: parseFloat(i.price),
      subtotal: parseFloat(i.subtotal),
    })),
  }))

  const salesTrend: SalesTrendPoint[] = monthBounds.map(({ start }, i) => ({
    month: MONTH_NAMES[start.getMonth()],
    revenue: parseFloat(trendTotals[i]?.[0]?.total ?? "0"),
  }))

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
    totalCount: transactionCount,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
    salesTrend,
  }
}
