import { NextRequest, NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { notifications } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { getUserIdFromToken } from "@/lib/auth-utils"

/**
 * PATCH /api/customer/notifications/[notificationId]
 * Mark notification as read
 * Body: { isRead: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const userId = getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { notificationId } = await params
    const body = await request.json()
    const { isRead } = body

    if (isRead === undefined) {
      return NextResponse.json(
        { success: false, message: "isRead flag is required" },
        { status: 400 }
      )
    }

    // Verify notification ownership
    const notification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .limit(1)

    if (!notification.length) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      )
    }

    const updated = await db
      .update(notifications)
      .set({
        isRead,
        readAt: isRead ? new Date() : null,
      })
      .where(eq(notifications.id, notificationId))
      .returning()

    return NextResponse.json(
      {
        success: true,
        message: "Notification updated",
        data: updated[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    )
  }
}
