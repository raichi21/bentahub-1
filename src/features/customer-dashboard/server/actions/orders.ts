"use server"

import { z } from "zod"
import { cancelOrder as cancelOrderDb } from "@/features/customer-dashboard/server/db/orders"

const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

export async function cancelOrderAction(
  unsafeData: z.infer<typeof cancelOrderSchema>
): Promise<{ success: boolean; message: string }> {
  const { success, data } = cancelOrderSchema.safeParse(unsafeData)

  if (!success) {
    return { success: false, message: "Invalid input" }
  }

  const order = await cancelOrderDb(data.orderId, data.userId)

  if (!order) {
    return { success: false, message: "Order not found or cannot be cancelled" }
  }

  return { success: true, message: "Order cancelled successfully" }
}
