import { db } from "@/drizzle/db"
import { orders, orderItems } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"

// ── Queries ──

export function getOrdersByUserId(userId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
}

export function getOrderById(orderId: string, userId: string) {
  return db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null)
}

export function getOrderItemsByOrderId(orderId: string) {
  return db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
}

// ── Mutations ──

export async function createOrder(data: {
  userId: string
  paymentMethod: "cash" | "gcash"
  branch: string
  totalAmount: string
  notes?: string | null
  pickupDeadline: Date
}) {
  const orderId = generateId()

  const [order] = await db
    .insert(orders)
    .values({ id: orderId, ...data })
    .returning()

  return order
}

export async function createOrderItems(
  items: Array<{
    orderId: string
    productId: string
    productName: string
    quantity: number
    price: string
    subtotal: string
  }>
) {
  const data = items.map((item) => ({
    id: generateId(),
    ...item,
  }))

  await db.insert(orderItems).values(data)
  return data
}

export async function cancelOrder(orderId: string, userId: string) {
  const [order] = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .returning()

  return order ?? null
}
