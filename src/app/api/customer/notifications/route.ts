import { NextRequest, NextResponse } from "next/server"
import { db } from "@/drizzle/db"
import { notifications } from "@/drizzle/schema"
import { eq, and, desc } from "drizzle-orm"
import { getRoleScopedUserId } from "@/lib/auth-utils"

/**
 * GET /api/customer/notifications
 * Retrieve all notifications for the authenticated user
 * Query params: limit=10, offset=0, unreadOnly=false
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getRoleScopedUserId(request, ["customer"])

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

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

    const userNotifications = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    // Get unread count
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      )

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications: userNotifications,
          unreadCount: unreadNotifications.length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/customer/notifications
 * Mark all notifications as read for the authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = getRoleScopedUserId(request, ["customer"])

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      )

    return NextResponse.json(
      { success: true, message: "All notifications marked as read" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error marking notifications as read:", error)
    return NextResponse.json(
      { success: false, message: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer/notifications
 * Clear all notifications for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getRoleScopedUserId(request, ["customer"])

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId))

    return NextResponse.json(
      { success: true, message: "All notifications cleared" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error clearing notifications:", error)
    return NextResponse.json(
      { success: false, message: "Failed to clear notifications" },
      { status: 500 }
    )
  }
}
