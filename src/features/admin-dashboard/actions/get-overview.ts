import { db } from "@/servers/db"
import type { AdminOverviewData, BranchStockData, SalesTrendData } from "@/types/admin"

interface RawTransaction {
  id: string
  branchId: string
  totalAmount: string
  paymentMethod: string
  status: string
  createdAt: Date
}

interface RawInventory {
  id: string
  branchId: string
  productId: string
  quantity: number
  lowStockThreshold: number
  updatedAt: Date
}

interface RawBranch {
  id: string
  name: string
  location: string | null
  capacity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function getMonthRange(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const end = monthsAgo === 0
    ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    : new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59)
  return { start, end }
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function computeTrend(current: number, previous: number): { trend: string; trendType: "up" | "down" | "warning" } {
  if (previous === 0) {
    return { trend: current > 0 ? "+100%" : "0%", trendType: current > 0 ? "up" : "warning" }
  }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return {
    trend: `${sign}${pct.toFixed(1)}%`,
    trendType: pct >= 0 ? "up" : "down",
  }
}

export async function getAdminOverview(): Promise<AdminOverviewData> {
  const allBranches = await db.query.branches.findMany() as RawBranch[]
  const allTransactions = await db.query.transactions.findMany() as RawTransaction[]
  const allInventory = await db.query.branchInventory.findMany() as RawInventory[]

  // --- Revenue KPI ---
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const currentMonthRevenue = allTransactions
    .filter((t: RawTransaction) => t.status === "completed" && new Date(t.createdAt) >= currentMonthStart)
    .reduce((sum: number, t: RawTransaction) => sum + parseFloat(t.totalAmount), 0)

  const lastMonthRevenue = allTransactions
    .filter((t: RawTransaction) => {
      const d = new Date(t.createdAt)
      return t.status === "completed" && d >= lastMonthStart && d < currentMonthStart
    })
    .reduce((sum: number, t: RawTransaction) => sum + parseFloat(t.totalAmount), 0)

  const revenueTrend = computeTrend(currentMonthRevenue, lastMonthRevenue)

  // --- Inventory KPI ---
  const totalStock = allInventory.reduce((sum: number, i: RawInventory) => sum + i.quantity, 0)
  const uniqueProducts = new Set(allInventory.map((i: RawInventory) => i.productId)).size

  const lowStockItems = allInventory.filter((i: RawInventory) => i.quantity < i.lowStockThreshold)

  // --- Sales Trend (last 12 months) ---
  const salesTrend: SalesTrendData[] = []
  for (let i = 11; i >= 0; i--) {
    const { start, end } = getMonthRange(i)
    const revenue = allTransactions
      .filter((t: RawTransaction) => {
        const d = new Date(t.createdAt)
        return t.status === "completed" && d >= start && d <= end
      })
      .reduce((sum: number, t: RawTransaction) => sum + parseFloat(t.totalAmount), 0)

    salesTrend.push({
      month: MONTH_NAMES[start.getMonth()],
      revenue,
    })
  }

  // --- Branch Stock ---
  const branchStock: BranchStockData[] = allBranches
    .filter((b: RawBranch) => b.isActive)
    .map((b: RawBranch) => {
      const branchInv = allInventory.filter((i: RawInventory) => i.branchId === b.id)
      const totalProducts = branchInv.length
      const lowInBranch = branchInv.filter((i: RawInventory) => i.quantity < i.lowStockThreshold).length
      const pct = b.capacity > 0 ? Math.round((totalProducts / b.capacity) * 100) : 0

      let status: "Healthy" | "Warning" | "Critical" = "Healthy"
      if (lowInBranch > 15) status = "Critical"
      else if (lowInBranch > 0) status = "Warning"

      return {
        id: b.id,
        name: b.name,
        totalItems: totalProducts,
        capacity: b.capacity,
        lowStockItems: lowInBranch,
        percentage: Math.min(pct, 100),
        status,
      }
    })

  // --- Payment Breakdown ---
  const completedTransactions = allTransactions.filter((t) => t.status === "completed")

  const cashTotal = completedTransactions
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)

  const gcashTotal = completedTransactions
    .filter((t) => t.paymentMethod === "gcash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)

  const totalPaymentRevenue = cashTotal + gcashTotal
  const cashPct = totalPaymentRevenue > 0 ? Math.round((cashTotal / totalPaymentRevenue) * 100) : 0
  const gcashPct = 100 - cashPct

  return {
    kpis: {
      totalRevenue: {
        value: formatCurrency(currentMonthRevenue),
        trend: revenueTrend.trend,
        trendType: revenueTrend.trendType,
      },
      totalInventory: {
        value: `${uniqueProducts} products`,
        trend: `${totalStock} items across ${allBranches.length} branches`,
        trendType: "up",
      },
      lowStockAlerts: {
        value: lowStockItems.length,
      },
    },
    salesTrend,
    branchStock,
    paymentBreakdown: {
      cashTotal,
      cashTotalDisplay: formatCurrency(cashTotal),
      gcashTotal,
      gcashTotalDisplay: formatCurrency(gcashTotal),
      cashPercentage: cashPct,
      gcashPercentage: gcashPct,
      totalDisplay: formatCurrency(totalPaymentRevenue),
    },
  }
}
