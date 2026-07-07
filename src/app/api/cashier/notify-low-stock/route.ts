import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, notifications } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const cashier = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!cashier) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { productId, productName, sku } = body

    if (!productId || !productName || !sku) {
      return NextResponse.json({ success: false, message: "Missing product details" }, { status: 400 })
    }

    const branch = cashier.branch
    if (!branch) {
      return NextResponse.json({ success: false, message: "Cashier has no assigned branch" }, { status: 400 })
    }

    const staffUsers = await db.query.users.findMany({
      where: and(eq(users.role, "staff"), eq(users.branch, branch), eq(users.isActive, true)),
    })

    if (staffUsers.length === 0) {
      return NextResponse.json({ success: false, message: "No staff users found in your branch" }, { status: 404 })
    }

    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.relatedProductId, productId),
        eq(notifications.type, "low-stock"),
        eq(notifications.isRead, false),
      ),
    })

    if (existingNotification) {
      return NextResponse.json({ success: true, message: "Staff already notified about this product" })
    }

    const notificationValues = staffUsers.map((staff) => ({
      id: generateId(),
      userId: staff.id,
      type: "low-stock" as const,
      title: `Low Stock Alert: ${productName}`,
      message: `${productName} (SKU: ${sku}) is running low on stock. This alert was raised by cashier ${cashier.fullName}.`,
      relatedProductId: productId,
      isRead: false,
      readAt: null,
      expiresAt: null,
      relatedOrderId: null,
    }))

    await db.insert(notifications).values(notificationValues)

    return NextResponse.json({
      success: true,
      message: `${staffUsers.length} staff member${staffUsers.length > 1 ? "s" : ""} notified about ${productName}`,
    })
  } catch (error) {
    console.error("Notify low stock error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while creating low stock notification" },
      { status: 500 },
    )
  }
}
