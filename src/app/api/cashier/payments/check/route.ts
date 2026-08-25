import { NextRequest } from "next/server"
import { retrievePaymentIntent } from "@/lib/paymongo"
import { db } from "@/servers/db"
import { transactions } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { apiResponse, apiError } from "@/lib/api-response"
import { completeGcashTransaction } from "@/features/cashier-dashboard/actions/finalize-transaction"

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const auth = checkRoleAuth(extractToken(request), ["cashier"], "Cashier area")
    if (auth.error) {
      return auth.error
    }

    const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    if (!paymentIntentId) {
      return apiError("Missing paymentIntentId", 400)
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    const isPaid = ["succeeded", "processing"].includes(paymentIntent.status)

    console.log("[check] paymentIntentId:", paymentIntentId, "status:", paymentIntent.status, "isPaid:", isPaid)

    // If payment succeeded, complete the transaction and deduct stock
    if (isPaid) {
      const txn = await db.query.transactions.findFirst({
        where: eq(transactions.gcashRef, paymentIntentId),
      })

      if (txn) {
        const result = await completeGcashTransaction(txn.id)
        if (result.deducted) {
          console.log("[check] Transaction completed and stock deducted for txn:", txn.id)
        }
      }
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
