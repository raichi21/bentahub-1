import { db } from "@/servers/db"
import { orders } from "@/servers/schemas"
import { eq } from "drizzle-orm"

export async function confirmPickup(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const existing = await db.query.orders.findFirst({ where: eq(orders.id, orderId) })
    if (!existing) {
      return { success: false, message: "Order not found" }
    }
    if (existing.status !== "ready") {
      return { success: false, message: "Order is not ready for pickup" }
    }

    await db.update(orders)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    return { success: true, message: "Pickup confirmed successfully" }
  } catch (error) {
    console.error("Confirm pickup error:", error)
    return { success: false, message: "An error occurred" }
  }
}
