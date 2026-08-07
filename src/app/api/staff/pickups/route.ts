import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, orders } from "@/servers/schemas"
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

    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const allOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.branch, branchName),
        or(
          eq(orders.status, "pending"),
          eq(orders.status, "processing"),
          eq(orders.status, "ready"),
          eq(orders.status, "completed"),
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
      user: { id: string; fullName: string; email: string }
      items: Array<{ id: string; productName: string; quantity: number; price: string; subtotal: string }>
    }>

    const payments = allOrders
      .filter((o) => !o.isPaid)
      .map((o) => ({
        id: o.id,
        transactionId: o.id,
        referenceNumber: o.paymentMethod === "gcash" ? `GC-${o.id.slice(0, 8).toUpperCase()}` : `CASH-${o.id.slice(0, 8).toUpperCase()}`,
        method: o.paymentMethod,
        amount: Number(o.totalAmount),
        status: o.status === "completed" ? "verified" : "pending",
        date: o.createdAt.toISOString(),
        customerName: o.user.fullName,
      }))

    const pickups = allOrders
      .filter((o) => o.isPaid)
      .map((o) => ({
        id: o.id,
        transactionId: o.id,
        customerName: o.user.fullName,
        code: `PK-${o.id.slice(0, 8).toUpperCase()}`,
        date: o.paidAt?.toISOString() || o.createdAt.toISOString(),
        status: o.status === "completed" ? "completed" : "ready",
      }))

    return NextResponse.json({
      success: true,
      message: "Pickups retrieved successfully",
      data: { payments, pickups },
    })
  } catch (error) {
    console.error("Staff pickups error:", error)
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

    const body = await request.json()
    const { orderId, action } = body

    if (!orderId || !action) {
      return NextResponse.json({ success: false, message: "orderId and action required" }, { status: 400 })
    }

    if (action === "verify") {
      await db.update(orders)
        .set({
          isPaid: true,
          paidAt: new Date(),
          status: "ready",
        })
        .where(eq(orders.id, orderId))
    } else if (action === "complete") {
      await db.update(orders)
        .set({ status: "completed" })
        .where(eq(orders.id, orderId))
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Order updated successfully" })
  } catch (error) {
    console.error("Staff pickups patch error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 },
    )
  }
}
