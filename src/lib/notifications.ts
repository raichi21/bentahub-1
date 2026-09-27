import { and, eq } from "drizzle-orm"
import { db } from "@/servers/db"
import { notifications, users } from "@/servers/schemas"
import { generateId } from "@/lib/auth-utils"

export type NotificationType =
  | "order-status"
  | "order-ready"
  | "order-completed"
  | "payment-received"
  | "low-stock"
  | "new-product"
  | "promotion"
  | "system"

export interface NotificationPayload {
  type: NotificationType
  title: string
  message: string
  relatedOrderId?: string | null
  relatedProductId?: string | null
  expiresAt?: Date | null
}

/**
 * Insert a notification for a single user, skipping if an identical unread
 * notification already exists (dedup by type + user + related entity).
 * Returns true if inserted, false if deduped.
 */
export async function notifyUser(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  const conditions = [
    eq(notifications.userId, userId),
    eq(notifications.type, payload.type),
    eq(notifications.isRead, false),
  ]
  if (payload.relatedOrderId) {
    conditions.push(eq(notifications.relatedOrderId, payload.relatedOrderId))
  } else if (payload.relatedProductId) {
    conditions.push(
      eq(notifications.relatedProductId, payload.relatedProductId)
    )
  }

  const existing = await db.query.notifications.findFirst({
    where: and(...conditions),
  })
  if (existing) return false

  await db.insert(notifications).values({
    id: generateId(),
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedOrderId: payload.relatedOrderId ?? null,
    relatedProductId: payload.relatedProductId ?? null,
    isRead: false,
    readAt: null,
    expiresAt: payload.expiresAt ?? null,
  })
  return true
}

/**
 * Notify all active admins. Returns the number of admins notified.
 */
export async function notifyAdmins(
  payload: NotificationPayload
): Promise<number> {
  const adminUsers = await db.query.users.findMany({
    where: and(eq(users.role, "admin"), eq(users.isActive, true)),
  })
  let count = 0
  for (const admin of adminUsers) {
    if (await notifyUser(admin.id, payload)) count++
  }
  return count
}
