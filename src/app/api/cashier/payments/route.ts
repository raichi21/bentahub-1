import { NextRequest } from "next/server"
import { verifyToken, extractToken, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, transactions, transactionItems } from "@/servers/schemas"
import { eq, max } from "drizzle-orm"
import { createCheckoutSession } from "@/lib/paymongo"
import { apiResponse, apiError } from "@/lib/api-response"

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) {
      return apiError("Authentication required", 401)
    }

    const payload = verifyToken(token)
    if (!payload) {
      return apiError("Invalid or expired token", 401)
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })
    if (!user) {
      return apiError("User not found", 404)
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return apiError("Branch not found", 404)
    }

    const body = await request.json()
    const { items, totalAmount } = body

    if (!items || items.length === 0) {
      return apiError("No items provided", 400)
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

    // Create PayMongo Checkout Session (returns real checkout_url for QR)
    const amountInCentavos = Math.round(totalAmount * 100)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const checkout = await createCheckoutSession({
      amount: amountInCentavos,
      description: `Receipt #${nextReceiptNumber} (txn:${transactionId}) - ${branchName}`,
      lineItems: items.map((item: { product: { name: string; price: number }; quantity: number }) => ({
        name: item.product.name,
        amount: Math.round(item.product.price * 100), // unit price in centavos
        quantity: item.quantity,
      })),
      successUrl: `${baseUrl}/cashier?gcash_success=receipt_${nextReceiptNumber}`,
      cancelUrl: `${baseUrl}/cashier?gcash_cancelled=receipt_${nextReceiptNumber}`,
    })

    // Store PaymentIntent ID on the transaction (for status checking)
    await db
      .update(transactions)
      .set({ gcashRef: checkout.paymentIntentId })
      .where(eq(transactions.id, transactionId))

    return apiResponse({
      success: true,
      message: "GCash payment initiated",
      data: {
        transactionId,
        receiptNumber: nextReceiptNumber,
        checkoutUrl: checkout.checkoutUrl,
        paymentIntentId: checkout.paymentIntentId,
        amount: totalAmount,
      },
    })
  } catch (error) {
    console.error("GCash payment error:", error)
    return apiError("Failed to process GCash payment", 500)
  }
}
