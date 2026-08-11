import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { cartItems, orders, orderItems } from "@/drizzle/schema"
import { eq, and, inArray, isNull, desc } from "drizzle-orm"
import { generateId, extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"
import { SERVICE_FEE_RATE, RESERVATION_BOND } from "@/lib/fees"

function getUserIdFromToken(request: NextRequest): string | null {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

/**
 * GET /api/customer/orders
 * Retrieve all orders with their items for the authenticated user
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), isNull(orders.deletedAt)))
      .orderBy(desc(orders.createdAt))

    // Attach items to each order
    if (userOrders.length > 0) {
      const orderIds = userOrders.map((o) => o.id)
      const allItems = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))

      const itemsByOrderId: Record<string, typeof allItems> = {}
      for (const item of allItems) {
        if (!itemsByOrderId[item.orderId]) itemsByOrderId[item.orderId] = []
        itemsByOrderId[item.orderId].push(item)
      }

      const enriched = userOrders.map((o) => ({
        ...o,
        items: itemsByOrderId[o.id] || [],
      }))

      return apiResponse({ success: true, data: enriched })
    }

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
    const { paymentMethod, branch, notes, phone } = body

    if (!paymentMethod || !branch) {
      return apiError("Payment method and branch are required")
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return apiError("Phone number is required")
    }

    if (!/^09\d{9}$/.test(phone.trim())) {
      return apiError("Phone number must be 11 digits starting with 09")
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
    const serviceFee = Number((subtotal * SERVICE_FEE_RATE).toFixed(2))
    const bond = RESERVATION_BOND
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
      phone: phone.trim(),
      isPaid: false,
      paidAt: null,
      pickupDeadline,
    }

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

    // #10: Wrap inserts in a DB transaction — if server crashes mid-way,
    // no orphaned orders or uncleared carts
    const result = await db.transaction(async (tx) => {
      const [createdOrder] = await tx
        .insert(orders)
        .values(newOrder)
        .returning()

      await tx.insert(orderItems).values(orderItemsData)

      await tx.delete(cartItems).where(eq(cartItems.userId, userId))

      return createdOrder
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order created successfully",
        data: { order: result, items: orderItemsData },
      }),
      { status: 201, headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return apiError("Failed to create order", 500)
  }
}
