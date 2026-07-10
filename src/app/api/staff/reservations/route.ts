import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, orders, notifications, orderItems } from "@/servers/schemas"
import { eq, and, or, desc } from "drizzle-orm"

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

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"

    const allOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.branch, branchName),
        or(
          eq(orders.status, "pending"),
          eq(orders.status, "processing"),
          eq(orders.status, "ready"),
        ),
      ),
      orderBy: desc(orders.createdAt),
      with: {
        user: true,
        items: true,
      },
    }) as Array<{
      id: string; userId: string; status: string; paymentMethod: string
      totalAmount: string; branch: string; notes: string | null
      isPaid: boolean; paidAt: Date | null; pickupDeadline: Date | null
      createdAt: Date; updatedAt: Date
      user: { id: string; fullName: string; email: string; phone: string | null }
      items: Array<{ id: string; productName: string; quantity: number; price: string; subtotal: string }>
    }>

    const mapped = allOrders.map((o) => ({
      id: o.id,
      status: o.status,
      paymentMethod: o.paymentMethod,
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      isPaid: o.isPaid,
      pickupDeadline: o.pickupDeadline?.toISOString() || null,
      createdAt: o.createdAt.toISOString(),
      customerName: o.user.fullName,
      customerEmail: o.user.email,
      customerPhone: o.user.phone || "",
      items: o.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.subtotal),
      })),
    }))

    return NextResponse.json({
      success: true,
      data: { reservations: mapped },
    })
  } catch (error) {
    console.error("Staff reservations error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
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

    const staff = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })
    if (!staff) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { orderId, action, reason } = body

    if (!orderId || !action) {
      return NextResponse.json({ success: false, message: "orderId and action required" }, { status: 400 })
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
    }

    if (action === "confirm") {
      if (order.status !== "pending") {
        return NextResponse.json({ success: false, message: "Only pending reservations can be confirmed" }, { status: 400 })
      }

      await db.update(orders)
        .set({ status: "processing" })
        .where(eq(orders.id, orderId))

      await db.insert(notifications).values({
        id: generateId(),
        userId: order.userId,
        type: "order-status",
        title: "Reservation Confirmed",
        message: `Your reservation at ${order.branch} has been confirmed by our staff. We are now preparing your order.`,
        relatedOrderId: orderId,
        isRead: false,
        readAt: null,
        expiresAt: null,
        relatedProductId: null,
      })
    } else if (action === "deny") {
      if (order.status !== "pending") {
        return NextResponse.json({ success: false, message: "Only pending reservations can be denied" }, { status: 400 })
      }

      await db.update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, orderId))

      await db.insert(notifications).values({
        id: generateId(),
        userId: order.userId,
        type: "order-status",
        title: "Reservation Denied",
        message: reason
          ? `Your reservation at ${order.branch} has been denied. Reason: ${reason}`
          : `Your reservation at ${order.branch} has been denied. Please contact the store for more information.`,
        relatedOrderId: orderId,
        isRead: false,
        readAt: null,
        expiresAt: null,
        relatedProductId: null,
      })
    } else if (action === "ready") {
      if (order.status !== "processing") {
        return NextResponse.json({ success: false, message: "Only processing reservations can be marked as ready" }, { status: 400 })
      }

      await db.update(orders)
        .set({ status: "ready" })
        .where(eq(orders.id, orderId))

      await db.insert(notifications).values({
        id: generateId(),
        userId: order.userId,
        type: "order-ready",
        title: "Order Ready for Pickup",
        message: `Your order at ${order.branch} is now ready for pickup. Please claim it before the pickup deadline.`,
        relatedOrderId: orderId,
        isRead: false,
        readAt: null,
        expiresAt: null,
        relatedProductId: null,
      })
    } else {
      return NextResponse.json({ success: false, message: "Invalid action. Use: confirm, deny, or ready" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Reservation updated successfully" })
  } catch (error) {
    console.error("Staff reservations patch error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    )
  }
}
