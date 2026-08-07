import { db } from "@/servers/db"
import { orders } from "@/servers/schemas"
import { eq, and, gte, lte, desc, type SQL } from "drizzle-orm"

export interface PickupFilterOptions {
  status?: string
  search?: string
  branch?: string
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "UN"
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

export async function getPickups(filters: PickupFilterOptions = { page: 1, pageSize: 15 }) {
  const allBranches = await db.query.branches.findMany()
  const branchMap = new Map(allBranches.map((b) => [b.id, b.name]))
  const now = new Date()

  const baseConditions: SQL[] = []
  if (filters.status) {
    baseConditions.push(eq(orders.status, filters.status as "pending" | "processing" | "ready" | "completed" | "cancelled"))
  }
  if (filters.branch) {
    baseConditions.push(eq(orders.branch, branchMap.get(filters.branch) ?? filters.branch))
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

  const allOrders = await db.query.orders.findMany({
    where,
    orderBy: [desc(orders.createdAt)],
    with: {
      user: true,
      items: true,
    },
  }) as Array<{
    id: string; userId: string; status: string; paymentMethod: string
    totalAmount: string; branch: string; notes: string | null
    isPaid: boolean; paidAt: Date | null; pickupDeadline: Date | null
    createdAt: Date; updatedAt: Date
    user: { id: string; fullName: string; email: string }
    items: Array<{ id: string; productName: string; quantity: number; price: string; subtotal: string }>
  }>

  let filtered = allOrders
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = allOrders.filter((o) =>
      o.id.toLowerCase().includes(q) ||
      o.user.fullName.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q)
    )
  }

  const total = filtered.length
  const completed = filtered.filter((o) => o.status === "completed").length
  const pending = filtered.filter((o) => o.status === "pending" || o.status === "processing").length
  const delayed = filtered.filter((o) =>
    (o.status === "pending" || o.status === "processing" || o.status === "ready") &&
    o.pickupDeadline && o.pickupDeadline < now
  ).length
  const urgent = filtered.filter((o) => o.status === "ready" && o.pickupDeadline && o.pickupDeadline < now).length
  const completedRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0"

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisWeek = filtered.filter((o) => o.createdAt >= weekAgo)
  const lastWeek = filtered.filter((o) =>
    o.createdAt >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
    o.createdAt < weekAgo
  )
  let totalTrend = "0%"
  if (lastWeek.length > 0) {
    const pct = ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100
    totalTrend = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
  } else if (thisWeek.length > 0) {
    totalTrend = "+100%"
  }

  const offset = (filters.page - 1) * filters.pageSize
  const pageRows = filtered.slice(offset, offset + filters.pageSize)

  const pickups = pageRows.map((o, idx) => {
    const totalAmount = Number(o.totalAmount)
    return {
      id: o.id,
      displayId: `PCK-${String(total - offset - idx).padStart(5, "0")}`,
      customerName: o.user.fullName,
      customerInitials: getInitials(o.user.fullName),
      customerEmail: o.user.email,
      branch: o.branch,
      itemsCount: o.items.length,
      items: o.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
      totalAmount: formatCurrency(totalAmount),
      pickupDeadline: o.pickupDeadline ? formatDate(o.pickupDeadline) : null,
      status: o.status,
      statusDisplay: o.status === "ready" ? "Ready for Pickup"
        : o.status === "pending" ? "Pending"
        : o.status === "processing" ? "Processing"
        : o.status === "completed" ? "Completed"
        : "Cancelled",
      createdAt: o.createdAt,
    }
  })

  return {
    metrics: {
      total,
      totalTrend,
      completed,
      completedRate: `${completedRate}%`,
      pending,
      urgentCount: urgent,
      delayed,
    },
    pickups,
    totalCount: total,
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
  }
}
