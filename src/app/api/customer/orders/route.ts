import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { cartItems, orders, orderItems } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId, extractToken, verifyToken } from "@/lib/auth-utils"

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = extractToken(request)

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  return decoded.userId
}

/**
 * GET /api/customer/orders
 * Retrieve all orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))

    return NextResponse.json(
      {
        success: true,
        data: userOrders,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/customer/orders
 * Create a new order from cart items (checkout)
 * Body: { paymentMethod: "cash" | "gcash", branch: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentMethod, branch, notes } = body

    if (!paymentMethod || !branch) {
      return NextResponse.json(
        { success: false, message: "Payment method and branch are required" },
        { status: 400 }
      )
    }

    if (!["cash", "gcash"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      )
    }

    // Fetch user's cart items
    const userCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId))

    if (userCartItems.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart is empty" },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = userCartItems.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    )

    // Create order
    const orderId = generateId()
    const now = new Date()
    const pickupDeadline = new Date(now)
    pickupDeadline.setHours(17, 0, 0, 0) // 5:00 PM
    if (now >= pickupDeadline) {
      // Past 5PM — deadline is tomorrow 5PM
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
      isPaid: paymentMethod === "gcash" ? false : false,
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

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: {
          order: createdOrder[0],
          items: orderItemsData,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    )
  }
}
