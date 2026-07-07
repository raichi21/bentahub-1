import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, transactions, transactionItems } from "@/servers/schemas"
import { eq, max } from "drizzle-orm"
import { createPaymentIntent } from "@/lib/paymongo"

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const body = await request.json()
    const { items, totalAmount, discountPercent } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: "No items provided" }, { status: 400 })
    }

    // Create transaction with pending status
    const transactionId = generateId()
    const maxResult = await db
      .select({ maxReceipt: max(transactions.receiptNumber) })
      .from(transactions)
      .where(eq(transactions.branchId, branchRecord.id))

    const nextReceiptNumber = (maxResult[0]?.maxReceipt ?? 0) + 1

    await db.insert(transactions).values({
      id: transactionId,
      branchId: branchRecord.id,
      receiptNumber: nextReceiptNumber,
      totalAmount: totalAmount.toString(),
      paymentMethod: "gcash",
      status: "pending",
    })

    const transactionItemsData = items.map((item: { product: { id: string; name: string; price: number }; quantity: number }) => ({
      id: generateId(),
      transactionId,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price.toString(),
      subtotal: (item.product.price * item.quantity).toString(),
    }))

    if (transactionItemsData.length > 0) {
      await db.insert(transactionItems).values(transactionItemsData)
    }

    // Create PayMongo PaymentIntent
    const amountInCentavos = Math.round(totalAmount * 100)
    const paymentIntent = await createPaymentIntent({
      amount: amountInCentavos,
      description: `Receipt #${nextReceiptNumber} (txn:${transactionId}) - ${branchName}`,
    })

    // Store PaymentIntent ID on the transaction
    await db
      .update(transactions)
      .set({ gcashRef: paymentIntent.id })
      .where(eq(transactions.id, transactionId))

    return NextResponse.json({
      success: true,
      message: "GCash payment initiated",
      data: {
        transactionId,
        receiptNumber: nextReceiptNumber,
        checkoutUrl: paymentIntent.checkoutUrl,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
      },
    })
  } catch (error) {
    console.error("GCash payment error:", error)
    return NextResponse.json({ success: false, message: "Failed to process GCash payment" }, { status: 500 })
  }
}
