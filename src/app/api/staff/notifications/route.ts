import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { notifications } from "@/servers/schemas"
import { eq, and, desc, inArray } from "drizzle-orm"
import type { Notification as DbNotification } from "@/drizzle/schema"

interface NotificationItem {
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

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, payload.userId))

    if (unreadOnly) {
      query = db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)))
    }

    const rows = (await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)) as DbNotification[]

    const unreadRows = (await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)))) as DbNotification[]

    const mapped: NotificationItem[] = rows.map((n) => ({
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
    }))

    return NextResponse.json({
      success: true,
      message: "Notifications retrieved",
      data: { notifications: mapped, unreadCount: unreadRows.length },
    })
  } catch (error) {
    console.error("Staff notifications error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching notifications" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, markAll } = body

    if (markAll) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)))
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(inArray(notifications.id, ids), eq(notifications.userId, payload.userId)))
      return NextResponse.json({ success: true, message: `${ids.length} notifications marked as read` })
    }

    const { notificationId } = body
    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, payload.userId)))
      return NextResponse.json({ success: true, message: "Notification marked as read" })
    }

    return NextResponse.json({ success: false, message: "No notification IDs provided" }, { status: 400 })
  } catch (error) {
    console.error("Staff notifications patch error:", error)
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

    await db
      .delete(notifications)
      .where(eq(notifications.userId, payload.userId))

    return NextResponse.json({ success: true, message: "All notifications cleared" })
  } catch (error) {
    console.error("Staff notifications delete error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
