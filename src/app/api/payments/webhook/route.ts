import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { transactions, branchInventory } from "@/servers/schemas"
import { eq, sql } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.data

    if (!event) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 })
    }

    const eventType = event.attributes?.type || event.type

    if (eventType !== "payment_intent.payment_succeeded") {
      return NextResponse.json({ success: true, message: "Event ignored" })
    }

    const paymentIntent = event.attributes?.data
    if (!paymentIntent) {
      return NextResponse.json({ success: false, message: "No payment intent data" }, { status: 400 })
    }

    const description = paymentIntent.attributes?.description || ""
    const txnMatch = description.match(/txn:([a-f0-9-]+)/i)
    if (!txnMatch) {
      return NextResponse.json({ success: false, message: "Could not extract transaction ID" }, { status: 400 })
    }

    const transactionId = txnMatch[1]

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, transactionId),
      with: { items: true },
    })

    if (!transaction) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ success: true, message: "Transaction already processed" })
    }

    await db
      .update(transactions)
      .set({ status: "completed" })
      .where(eq(transactions.id, transactionId))

    // Deduct inventory
    for (const item of transaction.items) {
      await db
        .update(branchInventory)
        .set({
          quantity: sql`${branchInventory.quantity} - ${item.quantity}`,
        })
        .where(
          sql`${branchInventory.branchId} = ${transaction.branchId} AND ${branchInventory.productId} = ${item.productId}`,
        )
    }

    return NextResponse.json({ success: true, message: "Transaction completed" })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ success: false, message: "Webhook processing failed" }, { status: 500 })
  }
}
