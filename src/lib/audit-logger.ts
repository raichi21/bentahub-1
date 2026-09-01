import { db } from "@/servers/db"
import { auditLogs, users } from "@/servers/schemas"
import { generateId } from "@/lib/auth-utils"
import { eq } from "drizzle-orm"

export interface LogAuditParams {
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  userRole?: string | null
  action: string
  category: "auth" | "inventory" | "cash_drawer" | "orders" | "user_mgmt" | "settings"
  severity?: "info" | "warning" | "critical"
  details?: Record<string, unknown> | string | null
  ipAddress?: string | null
  branchId?: string | null
}

/**
 * Asynchronously log an audit trail event.
 * Never throws so that core application logic is not interrupted.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    let email = params.userEmail || null
    let name = params.userName || null
    let role = params.userRole || null

    if (params.userId && (!email || !name || !role)) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, params.userId),
      })
      if (user) {
        email = email || user.email
        name = name || user.fullName
        role = role || user.role
      }
    }

    const detailsString =
      typeof params.details === "object" && params.details !== null
        ? JSON.stringify(params.details)
        : params.details || null

    await db.insert(auditLogs).values({
      id: generateId(),
      userId: params.userId || null,
      userEmail: email,
      userName: name,
      userRole: role,
      action: params.action,
      category: params.category,
      severity: params.severity || "info",
      details: detailsString,
      ipAddress: params.ipAddress || null,
      branchId: params.branchId || null,
    })
  } catch (err) {
    console.error("Failed to log audit event:", err)
  }
}
