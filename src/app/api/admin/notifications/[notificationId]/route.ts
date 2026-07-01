import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { markNotificationRead } from "@/features/admin-dashboard/actions/mark-notification-read"
import type { AdminApiResponse } from "@/types/admin"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
): Promise<NextResponse<AdminApiResponse>> {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const { notificationId } = await params

    await markNotificationRead(payload.userId, notificationId)

    return NextResponse.json({ success: true, message: "Notification marked as read" })
  } catch (error) {
    console.error("Admin mark-read error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
