import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/servers/db"
import { notifications } from "@/servers/schemas"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getAdminNotifications } from "@/features/admin-dashboard/actions/get-admin-notifications"
import { markNotificationsRead, markAllNotificationsRead } from "@/features/admin-dashboard/actions/mark-notification-read"
import type { AdminApiResponse } from "@/types/admin"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse>> {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const result = await getAdminNotifications(payload.userId, { limit, offset, unreadOnly })

    return NextResponse.json({
      success: true,
      message: "Notifications retrieved",
      data: result,
    })
  } catch (error) {
    console.error("Admin notifications error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<AdminApiResponse>> {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { ids, markAll } = body

    if (markAll) {
      await markAllNotificationsRead(payload.userId)
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await markNotificationsRead(payload.userId, ids)
      return NextResponse.json({ success: true, message: `${ids.length} notifications marked as read` })
    }

    return NextResponse.json({ success: false, message: "No notification IDs provided" }, { status: 400 })
  } catch (error) {
    console.error("Admin notifications error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    await db
      .delete(notifications)
      .where(eq(notifications.userId, payload.userId))

    return NextResponse.json({ success: true, message: "All notifications cleared" })
  } catch (error) {
    console.error("Admin notifications delete error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
