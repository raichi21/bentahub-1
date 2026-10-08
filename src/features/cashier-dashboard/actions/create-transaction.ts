import { db } from "@/servers/db"
import {
  transactions,
  transactionItems,
  branches,
  cashDrawerSessions,
} from "@/servers/schemas"
import { eq, max, and } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"
import { notifyAdmins } from "@/lib/notifications"
import { deductStockIn } from "./finalize-transaction"
import type { CartItem } from "@/types/cashier"

export interface CreateTransactionInput {
  branchId: string
  cashierId: string
  items: CartItem[]
  totalAmount: number
  paymentMethod: "cash" | "gcash"
  amountPaid?: number
  change?: number
}

export class NoOpenCashDrawerError extends Error {
  constructor() {
    super("Please open a cash drawer session first.")
    this.name = "NoOpenCashDrawerError"
  }
}

export async function createTransaction(input: CreateTransactionInput) {
  const { branchId, cashierId, items, totalAmount, paymentMethod } = input
  const transactionId = generateId()

  // Every sale — cash or GCash — belongs to an open drawer session so the
  // shift totals (cash expected + GCash) stay complete. No open drawer means
  // no sale, regardless of payment method.
  const openSession = await db.query.cashDrawerSessions.findFirst({
    where: and(
      eq(cashDrawerSessions.cashierId, cashierId),
      eq(cashDrawerSessions.branchId, branchId),
      eq(cashDrawerSessions.status, "open")
    ),
  })

  if (!openSession) {
    throw new NoOpenCashDrawerError()
  }

  const sessionId: string = openSession.id
  let amountPaid: string | null = null
  let change: string | null = null

  if (paymentMethod === "cash") {
    amountPaid = (input.amountPaid ?? totalAmount).toFixed(2)
    change = (input.change ?? 0).toFixed(2)
  } else {
    amountPaid = totalAmount.toFixed(2)
    change = null
  }

  // Wrap the receipt, the items, and the stock deduction in ONE transaction.
  // If stock can't fully cover the sale, nothing is committed — no orphan
  // "completed" transaction with stock never deducted.
  return db.transaction(async (tx) => {
    // Get the next sequential receipt number for this branch
    const maxResult = await tx
      .select({ maxReceipt: max(transactions.receiptNumber) })
      .from(transactions)
      .where(eq(transactions.branchId, branchId))

    const nextReceiptNumber = (maxResult[0]?.maxReceipt ?? 0) + 1

    const transactionItemsData = items.map((item) => ({
      id: generateId(),
      transactionId,
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price.toString(),
      subtotal: (item.product.price * item.quantity).toString(),
    }))

    await tx.insert(transactions).values({
      id: transactionId,
      branchId,
      cashierId,
      receiptNumber: nextReceiptNumber,
      totalAmount: totalAmount.toString(),
      paymentMethod,
      status: "completed",
      sessionId,
      amountPaid,
      change,
    })

    if (transactionItemsData.length > 0) {
      await tx.insert(transactionItems).values(transactionItemsData)
    }

    await deductStockIn(
      tx,
      branchId,
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))
    )

    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    })

    await notifyAdmins({
      type: "payment-received",
      title: `Payment Received: ${paymentMethod === "cash" ? "Cash" : "GCash"}`,
      message: `A payment of ₱${totalAmount.toFixed(2)} was received via ${paymentMethod} at ${branchRecord?.name || "Unknown Branch"}. Receipt #${nextReceiptNumber}`,
    })

    return { id: transactionId, receiptNumber: nextReceiptNumber }
  })
}
