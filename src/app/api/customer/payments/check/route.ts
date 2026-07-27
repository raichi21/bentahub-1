import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { orders } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"
import { retrievePaymentIntent, isPaymentSuccessful } from "@/lib/paymongo"

function getUserIdFromToken(request: NextRequest): string | null {
  const token = extractToken(request)
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  return decoded.userId
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromToken(request)
  if (!userId) return apiError("Unauthorized", 401)

  try {
    const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    const orderId = request.nextUrl.searchParams.get("orderId")

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
