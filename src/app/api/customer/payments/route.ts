import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { users, orders, orderItems } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"
import { createCheckoutSession } from "@/lib/paymongo"

function getUserIdFromToken(request: NextRequest): string | null {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return apiError("Order ID is required")
    }

    const existingOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))

    if (existingOrders.length === 0) {
      return apiError("Order not found", 404)
    }

    const order = existingOrders[0]

    if (order.userId !== userId) {
      return apiError("Unauthorized", 401)
    }

    // #8: Reject cash-only orders from GCash payment
    if (order.paymentMethod !== "gcash") {
      return apiError("This order is not set for GCash payment", 400)
    }

    // #9: Reject already-paid orders
    if (order.isPaid) {
      return apiError("This order has already been paid", 400)
    }

    if (order.gcashRef) {
      return apiResponse({
        success: true,
        data: {
          checkoutUrl: null,
          paymentIntentId: order.gcashRef,
          message: "Payment session already initiated",
        },
      })
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

    if (items.length === 0) {
      return apiError("Order has no items")
    }

    // Fetch user details for PayMongo billing info
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
    const user = userRecords[0]

    const totalAmountInCentavos = Math.round(Number(order.totalAmount) * 100)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const checkout = await createCheckoutSession({
      amount: totalAmountInCentavos,
      description: `Order #${orderId.substring(0, 8)} - ${order.branch}`,
      lineItems: items.map((item) => ({
        name: item.productName,
        amount: Math.round(Number(item.subtotal) * 100),
        quantity: item.quantity,
      })),
      successUrl: `${baseUrl}/customer/orders?gcash_success=${orderId}`,
      cancelUrl: `${baseUrl}/customer/orders?gcash_cancelled=${orderId}`,
      billing: user
        ? {
            name: user.fullName,
            email: user.email,
          }
        : undefined,
    })

    await db
      .update(orders)
      .set({ gcashRef: checkout.paymentIntentId })
      .where(eq(orders.id, orderId))

    return apiResponse({
      success: true,
      data: {
        checkoutUrl: checkout.checkoutUrl,
        paymentIntentId: checkout.paymentIntentId,
        amount: order.totalAmount,
      },
    })
  } catch (error) {
    console.error("Customer payment error:", error)
    return apiError("Failed to initiate GCash payment", 500)
  }
}

export async function GET() {
  return apiError("Method not allowed", 405)
}
