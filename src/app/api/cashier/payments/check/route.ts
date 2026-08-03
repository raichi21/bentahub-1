import { NextRequest } from "next/server"
import { retrievePaymentIntent } from "@/lib/paymongo"
import { db } from "@/servers/db"
import { transactions } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = extractToken(request)
    if (!token) {
      return apiError("Authentication required", 401)
    }
    const payload = verifyToken(token)
    if (!payload) {
      return apiError("Invalid or expired token", 401)
    }

    const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    if (!paymentIntentId) {
      return apiError("Missing paymentIntentId", 400)
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    const isPaid = ["succeeded", "processing"].includes(paymentIntent.status)

    console.log("[check] paymentIntentId:", paymentIntentId, "status:", paymentIntent.status, "isPaid:", isPaid)

    // If payment succeeded, update the transaction status in the database
    if (isPaid) {
      await db
        .update(transactions)
        .set({ status: "completed" })
        .where(eq(transactions.gcashRef, paymentIntentId))
    }

    return apiResponse({
      success: true,
      data: {
        status: paymentIntent.status,
        isPaid,
      },
    })
  } catch (error) {
    console.error("Payment check error:", error)
    return apiError("Failed to check payment status", 500)
  }
}
