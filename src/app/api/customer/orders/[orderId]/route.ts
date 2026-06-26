import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { orders } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

/**
 * PATCH /api/customer/orders/[orderId]
 * Cancel an order (only if status is "pending" or "processing")
 * Body: { status: "cancelled" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { orderId } = await params
    const body = await request.json()

    if (body.status !== "cancelled") {
      return NextResponse.json(
        { success: false, message: "Invalid status update" },
        { status: 400 }
      )
    }

    // Fetch the order and verify it belongs to this user
    const existingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

    if (existingOrders.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      )
    }

    const order = existingOrders[0]

    // Only allow cancelling pending or processing orders
    if (order.status !== "pending" && order.status !== "processing") {
      return NextResponse.json(
        { success: false, message: "Order cannot be cancelled in its current state" },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const updatedOrders = await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId))
      .returning()

    return NextResponse.json(
      {
        success: true,
        message: "Order cancelled successfully",
        data: updatedOrders[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { success: false, message: "Failed to cancel order" },
      { status: 500 }
    )
  }
}
