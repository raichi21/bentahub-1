import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { orders } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"
import { retrievePaymentIntent, isPaymentSuccessful } from "@/lib/paymongo"

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    let paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    const orderId = request.nextUrl.searchParams.get("orderId")

    // If only orderId is provided, look up gcashRef from the order
    if (!paymentIntentId && orderId) {
      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))

      if (existingOrders.length === 0) {
        return apiError("Order not found", 404)
      }
      if (existingOrders[0].userId !== userId) {
        return apiError("Unauthorized", 401)
      }

      paymentIntentId = existingOrders[0].gcashRef
      if (!paymentIntentId) {
        return apiError("No payment session found for this order", 400)
      }
    }

    if (!paymentIntentId) {
      return apiError("Missing paymentIntentId", 400)
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    if (isPaymentSuccessful(paymentIntent.status) && orderId) {
      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))

      if (existingOrders.length > 0 && existingOrders[0].userId === userId) {
        const order = existingOrders[0]

        // SECURITY: Verify the paymentIntentId belongs to this order
        if (order.gcashRef !== paymentIntentId) {
          return apiError("Payment intent does not match this order", 400)
        }

        if (!order.isPaid) {
          await db
            .update(orders)
            .set({
              isPaid: true,
              paidAt: new Date(),
            })
            .where(eq(orders.id, orderId))
        }
      }
    }

    return apiResponse({
      success: true,
      data: {
        status: paymentIntent.status,
        isPaid: isPaymentSuccessful(paymentIntent.status),
      },
    })
  } catch (error) {
    console.error("Payment check error:", error)
    return apiError("Failed to check payment status", 500)
  }
}
