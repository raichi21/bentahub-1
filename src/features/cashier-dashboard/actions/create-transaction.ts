import { db } from "@/servers/db"
import { transactions, transactionItems, users, notifications, branches, cashDrawerSessions } from "@/servers/schemas"
import { eq, max, and } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"
import { deductStock } from "./finalize-transaction"
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

  let sessionId: string | null = null
  let amountPaid: string | null = null
  let change: string | null = null

  if (paymentMethod === "cash") {
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

    sessionId = openSession.id
    amountPaid = (input.amountPaid ?? totalAmount).toFixed(2)
    change = (input.change ?? 0).toFixed(2)
  } else {
    amountPaid = totalAmount.toFixed(2)
    change = null
  }

  // Get the next sequential receipt number for this branch
  const maxResult = await db
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

  await db.insert(transactions).values({
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
    await db.insert(transactionItems).values(transactionItemsData)
  }

  await deductStock(
    branchId,
    items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
  )

  const adminUsers = await db.query.users.findMany({
    where: and(eq(users.role, "admin"), eq(users.isActive, true)),
  })

  const branchRecord = await db.query.branches.findFirst({
    where: eq(branches.id, branchId),
  })

  if (adminUsers.length > 0) {
    await db.insert(notifications).values(
      adminUsers.map((a) => ({
        id: generateId(),
        userId: a.id,
        type: "payment-received" as const,
        title: `Payment Received: ${paymentMethod === "cash" ? "Cash" : "GCash"}`,
        message: `A payment of ₱${totalAmount.toFixed(2)} was received via ${paymentMethod} at ${branchRecord?.name || "Unknown Branch"}. Receipt #${nextReceiptNumber}`,
        relatedOrderId: null,
        isRead: false,
        readAt: null,
        expiresAt: null,
        relatedProductId: null,
      }))
    )
  }

  return { id: transactionId, receiptNumber: nextReceiptNumber }
}
