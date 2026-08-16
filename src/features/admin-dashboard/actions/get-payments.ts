import { db } from "@/servers/db"
import { transactions } from "@/servers/schemas"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { formatPHDateTime, startOfManilaDay, endOfManilaDay } from "@/lib/date"

export interface PaymentFilterOptions {
  method?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  branchId?: string
  search?: string
  page: number
  pageSize: number
}

export interface PaymentPageData {
  metrics: {
    totalAmount: number
    totalAmountDisplay: string
    cashTotal: number
    cashTotalDisplay: string
    gcashTotal: number
    gcashTotalDisplay: string
    cashPercentage: number
    gcashPercentage: number
    completedCount: number
    pendingCount: number
    cancelledCount: number
    totalCount: number
  }
  payments: Array<{
    id: string
    displayId: string
    transactionId: string
    transactionDisplayId: string
    amount: number
    amountDisplay: string
    method: string
    methodDisplay: string
    dateTime: Date
    dateTimeDisplay: string
    branchId: string
    branchName: string
    status: string
    statusDisplay: string
  }>
  branches: { id: string; name: string }[]
  totalCount: number
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(d: Date): string {
  return formatPHDateTime(d, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export async function getPayments(filters: PaymentFilterOptions = { page: 1, pageSize: 15 }): Promise<PaymentPageData> {
  const allBranches = await db.query.branches.findMany()
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))

  const baseConditions: SQL[] = []
  if (filters.method) {
    baseConditions.push(eq(transactions.paymentMethod, filters.method as "cash" | "gcash"))
  }
  if (filters.status) {
    baseConditions.push(eq(transactions.status, filters.status as "pending" | "completed" | "cancelled"))
  }
  if (filters.branchId) {
    baseConditions.push(eq(transactions.branchId, filters.branchId))
  }
  if (filters.dateFrom) {
    baseConditions.push(gte(transactions.createdAt, startOfManilaDay(new Date(filters.dateFrom))))
  }
  if (filters.dateTo) {
    baseConditions.push(lte(transactions.createdAt, endOfManilaDay(new Date(filters.dateTo))))
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const allRows = await db.query.transactions.findMany({
    where,
    orderBy: [desc(transactions.createdAt)],
  }) as Array<{
    id: string; branchId: string; totalAmount: string; paymentMethod: string; status: string; createdAt: Date
  }>

  let filtered = allRows
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = allRows.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        (branchMap.get(t.branchId) || "").toLowerCase().includes(q)
    )
  }

  const totalCount = filtered.length

  const cashTotal = filtered
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
  const gcashTotal = filtered
    .filter((t) => t.paymentMethod === "gcash")
    .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
  const totalAmount = cashTotal + gcashTotal
  const cashPercentage = totalAmount > 0 ? Math.round((cashTotal / totalAmount) * 100) : 0
  const gcashPercentage = totalAmount > 0 ? Math.round((gcashTotal / totalAmount) * 100) : 0

  const completedCount = filtered.filter((t) => t.status === "completed").length
  const pendingCount = filtered.filter((t) => t.status === "pending").length
  const cancelledCount = filtered.filter((t) => t.status === "cancelled").length

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = filtered.slice(offset, offset + filters.pageSize)

  const payments = pageRows.map((t, idx) => {
    const amount = parseFloat(t.totalAmount)
    const statusDisplay = t.status === "completed" ? "Verified" : t.status === "pending" ? "Pending" : "Failed"
    return {
      id: t.id,
      displayId: `#P-${String(totalCount - offset - idx).padStart(4, "0")}`,
      transactionId: t.id,
      transactionDisplayId: `TRN-${String(totalCount - offset - idx).padStart(5, "0")}`,
      amount,
      amountDisplay: formatCurrency(amount),
      method: t.paymentMethod,
      methodDisplay: t.paymentMethod.toUpperCase(),
      dateTime: t.createdAt,
      dateTimeDisplay: formatDateTime(t.createdAt),
      branchId: t.branchId,
      branchName: branchMap.get(t.branchId) || "Unknown",
      status: t.status,
      statusDisplay,
    }
  })

  return {
    metrics: {
      totalAmount,
      totalAmountDisplay: formatCurrency(totalAmount),
      cashTotal,
      cashTotalDisplay: formatCurrency(cashTotal),
      gcashTotal,
      gcashTotalDisplay: formatCurrency(gcashTotal),
      cashPercentage,
      gcashPercentage,
      completedCount,
      pendingCount,
      cancelledCount,
      totalCount,
    },
    payments,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
    totalCount,
  }
}
