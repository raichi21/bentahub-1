import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { cartItems, orders, orderItems } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { generateId, extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"

function getUserIdFromToken(request: NextRequest): string | null {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

/**
 * GET /api/customer/orders
 * Retrieve all orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))

    return apiResponse({ success: true, data: userOrders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return apiError("Failed to fetch orders", 500)
  }
}

/**
 * POST /api/customer/orders
 * Create a new order from cart items (checkout)
 * Body: { paymentMethod: "cash" | "gcash", branch: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const body = await request.json()
    const { paymentMethod, branch, notes } = body

    if (!paymentMethod || !branch) {
      return apiError("Payment method and branch are required")
    }

    if (!["cash", "gcash"].includes(paymentMethod)) {
      return apiError("Invalid payment method")
    }

    // Fetch user's cart items
    const userCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))

    if (userCartItems.length === 0) {
      return apiError("Cart is empty")
    }

    // Calculate total amount (subtotal + service fee + bond)
    const subtotal = userCartItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    )
    const serviceFee = Number((subtotal * 0.01).toFixed(2))
    const bond = 50.00
    const totalAmount = Number((subtotal + serviceFee + bond).toFixed(2))

    // Create order
    const orderId = generateId()
    const now = new Date()
    const pickupDeadline = new Date(now)
    pickupDeadline.setHours(17, 0, 0, 0) // 5:00 PM
    if (now >= pickupDeadline) {
      pickupDeadline.setDate(pickupDeadline.getDate() + 1)
    }

    const newOrder = {
      id: orderId,
      userId,
      status: "pending" as const,
      paymentMethod: paymentMethod as "cash" | "gcash",
      totalAmount: totalAmount.toFixed(2),
      branch,
      notes: notes || null,
      isPaid: false,
      paidAt: null,
      pickupDeadline,
    }

    const createdOrder = await db
      .insert(orders)
      .values(newOrder)
      .returning()

    // Create order items from cart items
    const orderItemsData = userCartItems.map((item) => ({
      id: generateId(),
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }))

    await db.insert(orderItems).values(orderItemsData)

    // Clear user's cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId))

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order created successfully",
        data: { order: createdOrder[0], items: orderItemsData },
      }),
      { status: 201, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return apiError("Failed to create order", 500)
  }
}
