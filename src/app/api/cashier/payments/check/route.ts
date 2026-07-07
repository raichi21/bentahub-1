import { NextRequest, NextResponse } from "next/server"
import { retrievePaymentIntent } from "@/lib/paymongo"

export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get("paymentIntentId")
    if (!paymentIntentId) {
      return NextResponse.json({ success: false, message: "Missing paymentIntentId" }, { status: 400 })
    }

    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    return NextResponse.json({
      success: true,
      data: {
        status: paymentIntent.status,
        isPaid: paymentIntent.status === "succeeded",
      },
    })
  } catch (error) {
    console.error("Payment check error:", error)
    return NextResponse.json({ success: false, message: "Failed to check payment status" }, { status: 500 })
  }
}
