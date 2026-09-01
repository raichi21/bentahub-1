import { db } from "@/servers/db"
import { auditLogs, users } from "@/servers/schemas"
import { eq, and, gte, lte, sql, or, ilike, desc, count } from "drizzle-orm"

export interface AuditLogFilterOptions {
  category?: string
  severity?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface AuditLogRow {
  id: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  userRole: string | null
  action: string
  category: string
  categoryDisplay: string
  severity: "info" | "warning" | "critical"
  details: string | null
  formattedDetails: Record<string, unknown> | string | null
  ipAddress: string | null
  createdAt: Date
  createdAtDisplay: string
}

export interface AuditLogsMetrics {
  totalLogs: number
  securityEvents: number
  inventoryEvents: number
  criticalEvents: number
}

export interface AuditLogsData {
  metrics: AuditLogsMetrics
  logs: AuditLogRow[]
  totalCount: number
  page: number
  pageSize: number
}

function startOfManilaDay(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfManilaDay(d: Date): Date {
  const date = new Date(d)
  date.setHours(23, 59, 59, 999)
  return date
}

const CATEGORY_DISPLAY: Record<string, string> = {
  auth: "Authentication",
  inventory: "Inventory",
  cash_drawer: "Cash Drawer",
  orders: "Orders",
  user_mgmt: "User Management",
  settings: "Settings",
}

export async function getAuditLogs(filters: AuditLogFilterOptions = {}): Promise<AuditLogsData> {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 15))

  const conditions = []

  if (filters.category && filters.category !== "all") {
    conditions.push(eq(auditLogs.category, filters.category as any))
  }

  if (filters.severity && filters.severity !== "all") {
    conditions.push(eq(auditLogs.severity, filters.severity as any))
  }

  if (filters.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, startOfManilaDay(new Date(filters.dateFrom))))
  }

  if (filters.dateTo) {
    conditions.push(lte(auditLogs.createdAt, endOfManilaDay(new Date(filters.dateTo))))
  }

  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`
    conditions.push(
      or(
        ilike(auditLogs.userName, q),
        ilike(auditLogs.userEmail, q),
        ilike(auditLogs.action, q),
        ilike(auditLogs.details, q)
      )
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Total count matching filters
  const countRes = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(whereClause)
  const totalCount = Number(countRes[0]?.total ?? 0)

  // Metrics (overall database totals)
  const totalAllRes = await db.select({ total: count() }).from(auditLogs)
  const totalAll = Number(totalAllRes[0]?.total ?? 0)

  const securityRes = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(or(eq(auditLogs.category, "auth"), eq(auditLogs.category, "user_mgmt")))
  const securityEvents = Number(securityRes[0]?.total ?? 0)

  const inventoryRes = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(eq(auditLogs.category, "inventory"))
  const inventoryEvents = Number(inventoryRes[0]?.total ?? 0)

  const criticalRes = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(eq(auditLogs.severity, "critical"))
  const criticalEvents = Number(criticalRes[0]?.total ?? 0)

  // Paginated records
  const rawLogs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  const logs: AuditLogRow[] = rawLogs.map((log) => {
    let parsedDetails: Record<string, unknown> | string | null = null
    if (log.details) {
      try {
        parsedDetails = JSON.parse(log.details)
      } catch {
        parsedDetails = log.details
      }
    }

    const dt = new Date(log.createdAt)
    const formattedDate = dt.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    return {
      id: log.id,
      userId: log.userId,
      userEmail: log.userEmail,
      userName: log.userName || "System",
      userRole: log.userRole || "system",
      action: log.action,
      category: log.category,
      categoryDisplay: CATEGORY_DISPLAY[log.category] || log.category,
      severity: log.severity as "info" | "warning" | "critical",
      details: log.details,
      formattedDetails: parsedDetails,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      createdAtDisplay: formattedDate,
    }
  })

  return {
    metrics: {
      totalLogs: totalAll,
      securityEvents,
      inventoryEvents,
      criticalEvents,
    },
    logs,
    totalCount,
    page,
    pageSize,
  }
}
