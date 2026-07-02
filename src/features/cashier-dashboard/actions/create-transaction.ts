import { db } from "@/servers/db"
import { transactions, transactionItems, branchInventory } from "@/servers/schemas"
import { eq, sql, max } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"
import type { CartItem } from "@/types/cashier"

export interface CreateTransactionInput {
  branchId: string
  items: CartItem[]
  totalAmount: number
  paymentMethod: "cash" | "gcash"
}

export async function createTransaction(input: CreateTransactionInput) {
  const { branchId, items, totalAmount, paymentMethod } = input
  const transactionId = generateId()

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
    receiptNumber: nextReceiptNumber,
    totalAmount: totalAmount.toString(),
    paymentMethod,
    status: "completed",
  })

  if (transactionItemsData.length > 0) {
    await db.insert(transactionItems).values(transactionItemsData)
  }

  for (const item of items) {
    await db
      .update(branchInventory)
      .set({
        quantity: sql`${branchInventory.quantity} - ${item.quantity}`,
      })
      .where(
        sql`${branchInventory.branchId} = ${branchId} AND ${branchInventory.productId} = ${item.product.id}`
      )
  }

  return { id: transactionId, receiptNumber: nextReceiptNumber }
}
