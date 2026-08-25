import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, orders, notifications } from "@/servers/schemas"
import { eq, and, or, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")
    if (auth.error) {
      return auth.error
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
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
      phone: string | null
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
      customerPhone: o.phone || "",
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
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")
    if (auth.error) {
      return auth.error
    }

    const staff = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })
    if (!staff) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { orderId, action } = body

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

      const adminUsers = await db.query.users.findMany({
        where: and(eq(users.role, "admin"), eq(users.isActive, true)),
      })

      await db.insert(notifications).values(
        adminUsers.map((a) => ({
          id: generateId(),
          userId: a.id,
          type: "order-status" as const,
          title: "Reservation Confirmed",
          message: `Order ${orderId} at ${order.branch} was confirmed by ${staff.fullName}.`,
          relatedOrderId: orderId,
          isRead: false,
          readAt: null,
          expiresAt: null,
          relatedProductId: null,
        }))
      )
    } else if (action === "cancel") {
      if (order.status !== "pending") {
        return NextResponse.json({ success: false, message: "Only pending reservations can be cancelled" }, { status: 400 })
      }

      await db.update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, orderId))

      await db.insert(notifications).values({
        id: generateId(),
        userId: order.userId,
        type: "order-status",
        title: "Reservation Cancelled",
        message: `Your reservation at ${order.branch} has been cancelled — pickup deadline has passed.`,
        relatedOrderId: orderId,
        isRead: false,
        readAt: null,
        expiresAt: null,
        relatedProductId: null,
      })

      const adminUsersCancel = await db.query.users.findMany({
        where: and(eq(users.role, "admin"), eq(users.isActive, true)),
      })

      await db.insert(notifications).values(
        adminUsersCancel.map((a) => ({
          id: generateId(),
          userId: a.id,
          type: "order-status" as const,
          title: "Reservation Cancelled",
          message: `Order ${orderId} at ${order.branch} was cancelled by ${staff.fullName} — pickup deadline has passed.`,
          relatedOrderId: orderId,
          isRead: false,
          readAt: null,
          expiresAt: null,
          relatedProductId: null,
        }))
      )
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

      const adminUsersReady = await db.query.users.findMany({
        where: and(eq(users.role, "admin"), eq(users.isActive, true)),
      })

      await db.insert(notifications).values(
        adminUsersReady.map((a) => ({
          id: generateId(),
          userId: a.id,
          type: "order-ready" as const,
          title: "Order Ready for Pickup",
          message: `Order ${orderId} at ${order.branch} was marked as ready for pickup by ${staff.fullName}.`,
          relatedOrderId: orderId,
          isRead: false,
          readAt: null,
          expiresAt: null,
          relatedProductId: null,
        }))
      )
    } else {
      return NextResponse.json({ success: false, message: "Invalid action. Use: confirm, cancel, or ready" }, { status: 400 })
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
