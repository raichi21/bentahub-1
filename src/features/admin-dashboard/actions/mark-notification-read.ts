import { db } from "@/servers/db"
import { notifications } from "@/servers/schemas"
import { eq, and, inArray } from "drizzle-orm"

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
}

export async function markNotificationsRead(
  userId: string,
  ids: string[]
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        inArray(notifications.id, ids),
        eq(notifications.userId, userId)
      )
    )
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
}
