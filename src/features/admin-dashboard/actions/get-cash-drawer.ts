import { db } from "@/servers/db"
import { cashDrawerSessions, users } from "@/servers/schemas"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { formatPHDateTime, startOfManilaDay, endOfManilaDay } from "@/lib/date"

export interface CashDrawerFilterOptions {
  cashierId?: string
  dateFrom?: string
  dateTo?: string
  branchId?: string
  page: number
  pageSize: number
}

export interface CashDrawerPageData {
  metrics: {
    openCount: number
    closedCount: number
    totalNetworkCash: number
    totalNetworkCashDisplay: string
    totalDiscrepancy: number
    totalDiscrepancyDisplay: string
  }
  sessions: Array<{
    id: string
    displayId: string
    branchId: string
    branchName: string
    cashierId: string | null
    cashierName: string
    openedAt: Date
    openedAtDisplay: string
    closedAt: Date | null
    closedAtDisplay: string | null
    startingCash: number
    startingCashDisplay: string
    expectedEndingCash: number | null
    expectedEndingCashDisplay: string
    actualEndingCash: number | null
    actualEndingCashDisplay: string
    netCashImpact: number
    netCashImpactDisplay: string
    diff: number | null
    diffDisplay: string
    notes: string | null
    status: string
    statusDisplay: string
  }>
  branches: { id: string; name: string }[]
  cashiers: { id: string; name: string }[]
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

export async function getCashDrawerSessions(
  filters: CashDrawerFilterOptions = { page: 1, pageSize: 15 }
): Promise<CashDrawerPageData> {
  const allBranches = await db.query.branches.findMany()
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))

  const allCashiers = await db.query.users.findMany({
    where: eq(users.role, "cashier"),
  })
  const cashierMap = new Map(allCashiers.map((c) => [c.id, c.fullName]))

  const baseConditions: SQL[] = []
  if (filters.cashierId) {
    baseConditions.push(eq(cashDrawerSessions.cashierId, filters.cashierId))
  }
  if (filters.branchId) {
    baseConditions.push(eq(cashDrawerSessions.branchId, filters.branchId))
  }
  if (filters.dateFrom) {
    baseConditions.push(gte(cashDrawerSessions.openedAt, startOfManilaDay(new Date(filters.dateFrom))))
  }
  if (filters.dateTo) {
    baseConditions.push(lte(cashDrawerSessions.openedAt, endOfManilaDay(new Date(filters.dateTo))))
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined

  const sessions = await db.query.cashDrawerSessions.findMany({
    where,
    orderBy: [desc(cashDrawerSessions.openedAt)],
  })

  const totalCount = sessions.length

  const totalNetworkCash = sessions
    .filter((s) => s.status === "closed" && s.actualEndingCash != null)
    .reduce((sum, s) => sum + parseFloat(s.actualEndingCash as unknown as string), 0)

  const totalDiscrepancy = sessions
    .filter((s) => s.status === "closed" && s.expectedEndingCash != null && s.actualEndingCash != null)
    .reduce((sum, s) => sum + (parseFloat(s.actualEndingCash as unknown as string) - parseFloat(s.expectedEndingCash as unknown as string)), 0)

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = sessions.slice(offset, offset + filters.pageSize)

  const mappedSessions = pageRows.map((s, idx) => {
    const startingCash = parseFloat(s.startingCash as unknown as string)
    const expected = s.expectedEndingCash != null ? parseFloat(s.expectedEndingCash as unknown as string) : null
    const actual = s.actualEndingCash != null ? parseFloat(s.actualEndingCash as unknown as string) : null
    const diff = expected != null && actual != null ? actual - expected : null
    const netCashImpact = actual != null ? actual - startingCash : (expected != null ? expected - startingCash : 0)

    return {
      id: s.id,
      displayId: `#CD-${String(totalCount - offset - idx).padStart(4, "0")}`,
      branchId: s.branchId,
      branchName: branchMap.get(s.branchId) || "Unknown",
      cashierId: s.cashierId,
      cashierName: (s.cashierId && cashierMap.get(s.cashierId)) || "Unknown",
      openedAt: s.openedAt,
      openedAtDisplay: formatDateTime(s.openedAt),
      closedAt: s.closedAt,
      closedAtDisplay: s.closedAt ? formatDateTime(s.closedAt) : null,
      startingCash,
      startingCashDisplay: formatCurrency(startingCash),
      expectedEndingCash: expected,
      expectedEndingCashDisplay: expected != null ? formatCurrency(expected) : "—",
      actualEndingCash: actual,
      actualEndingCashDisplay: actual != null ? formatCurrency(actual) : "—",
      netCashImpact,
      netCashImpactDisplay: formatCurrency(netCashImpact),
      diff,
      diffDisplay: diff != null ? formatCurrency(diff) : "—",
      notes: s.notes,
      status: s.status,
      statusDisplay: s.status === "open" ? "Open" : "Closed",
    }
  })

  return {
    metrics: {
      openCount: sessions.filter((s) => s.status === "open").length,
      closedCount: sessions.filter((s) => s.status === "closed").length,
      totalNetworkCash,
      totalNetworkCashDisplay: formatCurrency(totalNetworkCash),
      totalDiscrepancy,
      totalDiscrepancyDisplay: formatCurrency(totalDiscrepancy),
    },
    sessions: mappedSessions,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
    cashiers: allCashiers.map((c) => ({ id: c.id, name: c.fullName })),
    totalCount,
  }
}
