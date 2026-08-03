import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/drizzle/db"
import { orders } from "@/drizzle/schema"
import { transactions } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { completeGcashTransaction } from "@/features/cashier-dashboard/actions/finalize-transaction"

/**
 * PayMongo webhook handler for async payment notifications.
 *
 * Events handled:
 *   - payment.paid   → updates order/transaction isPaid + paidAt
 *   - payment.failed → updates order/transaction status accordingly
 *
 * Configure in PayMongo Dashboard:
 *   Webhook URL: https://yourdomain.com/api/webhooks/paymongo
 *   Events: payment.paid, payment.failed
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Optional webhook signature verification
    const signatureHeader = request.headers.get("paymongo-signature")
    if (signatureHeader) {
      verifySignature(rawBody, signatureHeader)
    }

    const payload = JSON.parse(rawBody)
    const event = payload.data
    const eventType: string = event?.attributes?.type || ""
    const eventData = event?.attributes?.data || {}
    const paymentAttrs = eventData?.attributes || {}

    const paymentIntentId: string | undefined =
      paymentAttrs.payment_intent_id || paymentAttrs.paymentIntentId
    const paymentStatus: string = paymentAttrs.status || ""

    if (!paymentIntentId) {
      console.warn("[webhook] No paymentIntentId in event:", eventType)
      return NextResponse.json({ received: true })
    }

    if (eventType === "payment.paid" || ["paid", "processing"].includes(paymentStatus)) {
      // Try to update orders table (customer flow)
      try {
        const orderResult = await db
          .update(orders)
          .set({
            isPaid: true,
            paidAt: new Date(),
          })
          .where(eq(orders.gcashRef, paymentIntentId))

        if (orderResult) {
          console.log(`[webhook] Updated order with gcashRef=${paymentIntentId}`)
        }
      } catch (e) {
        console.warn("[webhook] orders update failed (may be drizzle/column mismatch):", e)
      }

      // Try to update transactions table (cashier flow)
      try {
        const txn = await db.query.transactions.findFirst({
          where: eq(transactions.gcashRef, paymentIntentId),
        })

        if (txn) {
          const result = await completeGcashTransaction(txn.id)
          if (result.deducted) {
            console.log(`[webhook] Transaction completed and stock deducted for txn=${txn.id}`)
          }
        }
      } catch (e) {
        console.warn("[webhook] transactions update failed:", e)
      }
    }

    if (eventType === "payment.failed" || paymentStatus === "failed") {
      // Optionally mark as failed
      console.log(`[webhook] Payment failed for paymentIntentId=${paymentIntentId}`)
    }

    // Always acknowledge receipt — PayMongo will retry on non-200
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[webhook] Error:", error)
    return NextResponse.json({ received: false, error: "Internal error" }, { status: 500 })
  }
}

/**
 * Verify PayMongo webhook signature.
 * Header format: Paymongo-Signature: t=<timestamp>,v1=<signature>
 * The signature is HMAC-SHA256(secret, timestamp + "." + rawBody)
 */
function verifySignature(rawBody: string, signatureHeader: string): void {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[webhook] PAYMONGO_WEBHOOK_SECRET not set, skipping verification")
    return
  }

  const parts = signatureHeader.split(",")
  let timestamp = ""
  let signature = ""
  for (const part of parts) {
    const [key, value] = part.split("=")
    if (key === "t") timestamp = value
    if (key === "v1") signature = value
  }

  if (!timestamp || !signature) {
    throw new Error("Invalid PayMongo signature header format")
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")

  if (expectedSignature.length !== signature.length) {
    throw new Error("PayMongo webhook signature mismatch (length)")
  }

  if (!timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    throw new Error("PayMongo webhook signature mismatch")
  }
}
