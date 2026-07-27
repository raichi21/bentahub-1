import { NextRequest, NextResponse } from "next/server"
import { retrievePaymentIntent } from "@/lib/paymongo"
import { db } from "@/servers/db"
import { transactions } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    if (!paymentIntentId) {
      return NextResponse.json({ success: false, message: "Missing paymentIntentId" }, { status: 400 })
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    const isPaid = paymentIntent.status === "succeeded"

    // If payment succeeded, update the transaction status in the database
    if (isPaid) {
      await db
        .update(transactions)
        .set({ status: "completed" })
        .where(eq(transactions.gcashRef, paymentIntentId))
    }

    return NextResponse.json({
      success: true,
      data: {
        status: paymentIntent.status,
        isPaid,
      },
    })
  } catch (error) {
    console.error("Payment check error:", error)
    return NextResponse.json({ success: false, message: "Failed to check payment status" }, { status: 500 })
  }
}
