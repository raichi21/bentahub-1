import { db } from "@/servers/db"
import { notifications } from "@/servers/schemas"
import { eq, and, desc } from "drizzle-orm"
import type { Notification as DbNotification } from "@/drizzle/schema"

export interface AdminNotificationItem {
  id: string
  title: string
  message: string
  type: string
  category: string
  severity: "critical" | "info" | "success" | "warning"
  timestamp: string
  createdAt: Date
  isRead: boolean
  icon: string
}

interface GetAdminNotificationsResult {
  notifications: AdminNotificationItem[]
  unreadCount: number
}

const severityMap: Record<string, "critical" | "info" | "success" | "warning"> = {
  "low-stock": "critical",
  "order-status": "info",
  "order-ready": "success",
  "order-completed": "success",
  "payment-received": "success",
  "new-product": "info",
  promotion: "info",
  system: "info",
}

const categoryMap: Record<string, string> = {
  "low-stock": "Inventory",
  "new-product": "Inventory",
  "order-status": "Orders",
  "order-ready": "Orders",
  "order-completed": "Orders",
  "payment-received": "Payment",
  promotion: "Promotions",
  system: "System",
}

const iconMap: Record<string, string> = {
  "low-stock": "AlertTriangle",
  "new-product": "Package",
  "order-status": "Bell",
  "order-ready": "Bell",
  "order-completed": "Bell",
  "payment-received": "Bell",
  promotion: "Bell",
  system: "RefreshCw",
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
}

export async function getAdminNotifications(
  userId: string,
  options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
): Promise<GetAdminNotificationsResult> {
  const { limit = 20, offset = 0, unreadOnly = false } = options

  let query = db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))

  if (unreadOnly) {
    query = db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
  }

  const rows = (await query
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset)) as DbNotification[]

  const unreadRows = (await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))) as DbNotification[]

  return {
    notifications: rows.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      category: categoryMap[n.type] || "System",
      severity: severityMap[n.type] || "info",
      timestamp: timeAgo(new Date(n.createdAt)),
      createdAt: new Date(n.createdAt),
      isRead: n.isRead,
      icon: iconMap[n.type] || "Bell",
    })),
    unreadCount: unreadRows.length,
  }
}
