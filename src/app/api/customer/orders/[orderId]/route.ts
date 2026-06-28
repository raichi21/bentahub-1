import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { orders, orderItems } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"

function getUserIdFromToken(request: NextRequest): string | null {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

/**
 * GET /api/customer/orders/[orderId]
 * Retrieve a single order with its items for the authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const { orderId } = await params

    const existingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

    if (existingOrders.length === 0) {
      return apiError("Order not found", 404)
    }

    const order = existingOrders[0]
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    return apiResponse({ success: true, data: { ...order, items } })
  } catch (error) {
    console.error("Error fetching order:", error)
    return apiError("Failed to fetch order", 500)
  }
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
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const { orderId } = await params
    const body = await request.json()

    if (body.status !== "cancelled") {
      return apiError("Invalid status update")
    }

    const existingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

    if (existingOrders.length === 0) {
      return apiError("Order not found", 404)
    }

    const order = existingOrders[0]

    if (order.status !== "pending" && order.status !== "processing") {
      return apiError("Order cannot be cancelled in its current state")
    }

    const [updated] = await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId))
      .returning()

    return apiResponse({ success: true, message: "Order cancelled successfully", data: updated })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return apiError("Failed to cancel order", 500)
  }
}

/**
 * DELETE /api/customer/orders/[orderId]
 * Delete an order from transaction history (completed/cancelled only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const { orderId } = await params

    const existingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

    if (existingOrders.length === 0) {
      return apiError("Order not found", 404)
    }

    // Only allow deleting completed or cancelled orders
    const order = existingOrders[0]
    if (order.status !== "completed" && order.status !== "cancelled") {
      return apiError("Only completed or cancelled orders can be deleted")
    }

    // Delete order items first, then the order
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId))
    await db.delete(orders).where(eq(orders.id, orderId))

    return apiResponse({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return apiError("Failed to delete order", 500)
  }
}
