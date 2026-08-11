import { db } from "@/servers/db"
import { orders } from "@/servers/schemas"
import { eq, and, gte, lte, desc, type SQL } from "drizzle-orm"
import type { ReservationMetricsData, ReservationRowData, ReservationItemData } from "@/types/admin"

export interface ReservationFilterOptions {
  branch?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page: number
  pageSize: number
}

export interface ReservationPageData {
  metrics: ReservationMetricsData
  reservations: ReservationRowData[]
  totalCount: number
  branches: { id: string; name: string }[]
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export async function getReservations(filters: ReservationFilterOptions = { page: 1, pageSize: 15 }): Promise<ReservationPageData> {
  const allBranches = await db.query.branches.findMany()

  const baseConditions: SQL[] = []
  if (filters.branch) {
    baseConditions.push(eq(orders.branch, filters.branch))
  }
  if (filters.status) {
    baseConditions.push(eq(orders.status, filters.status as "pending" | "processing" | "ready" | "completed" | "cancelled"))
  }
  if (filters.dateFrom) {
    baseConditions.push(gte(orders.createdAt, new Date(filters.dateFrom)))
  }
  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo)
    endDate.setHours(23, 59, 59, 999)
    baseConditions.push(lte(orders.createdAt, endDate))
  }

  const where = baseConditions.length > 0 ? and(...baseConditions) : undefined

  let allMatched = await db.query.orders.findMany({
    where,
    orderBy: [desc(orders.createdAt)],
    with: {
      user: true,
      items: true,
    },
  }) as Array<{
    id: string; userId: string; status: string; totalAmount: string; branch: string
    phone: string | null
    pickupDeadline: Date | null; createdAt: Date
    user: { fullName: string; email: string }
    items: Array<{ id: string; productName: string; quantity: number; price: string; subtotal: string }>
  }>

  if (filters.search) {
    const q = filters.search.toLowerCase()
    allMatched = allMatched.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.user.fullName.toLowerCase().includes(q)
    )
  }

  const total = allMatched.length
  const pending = allMatched.filter((o) => o.status === "pending" || o.status === "processing").length
  const completed = allMatched.filter((o) => o.status === "completed").length
  const cancelled = allMatched.filter((o) => o.status === "cancelled").length

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = allMatched.slice(offset, offset + filters.pageSize)
  const reservationsList: ReservationRowData[] = pageRows.map((o, idx) => {
    const name = o.user.fullName
    return {
      id: o.id,
      displayId: `RVN-${String(total - offset - idx).padStart(4, "0")}`,
      customerName: name,
      customerInitials: getInitials(name),
      customerEmail: o.user.email || "",
      customerPhone: o.phone || null,
      branch: o.branch,
      itemsCount: o.items.length,
      totalAmount: o.totalAmount,
      items: o.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: parseFloat(i.price),
        subtotal: parseFloat(i.subtotal),
      })) as ReservationItemData[],
      pickupDeadline: o.pickupDeadline?.toISOString() ?? null,
      status: o.status,
      createdAt: o.createdAt,
    }
  })

  const prevMonth = new Date()
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const prevCount = allMatched.filter((o) => o.createdAt >= prevMonth).length
  const prevMonthTotal = allMatched.filter((o) => {
    const m = new Date()
    m.setMonth(m.getMonth() - 2)
    return o.createdAt >= m && o.createdAt < prevMonth
  }).length

  let totalTrend = "0%"
  if (prevMonthTotal > 0) {
    const pct = ((prevCount - prevMonthTotal) / prevMonthTotal) * 100
    totalTrend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  } else if (prevCount > 0) {
    totalTrend = "+100%"
  }

  return {
    metrics: {
      total,
      totalTrend,
      pending,
      completed,
      cancelled,
    },
    reservations: reservationsList,
    totalCount: total,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
  }
}
