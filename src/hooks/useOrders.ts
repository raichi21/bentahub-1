import { useCallback } from "react"
import { useOrdersStore, type Order } from "@/stores/ordersStore"
import { useAuth } from "./useAuth"

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function useOrders() {
  const { user, token } = useAuth()
  const ordersStore = useOrdersStore()

  /**
   * Fetch user's orders from backend
   */
  const fetchOrders = useCallback(async () => {
    if (!user || !token) return
    if (ordersStore.isLoading) return

    try {
      ordersStore.setLoading(true)
      ordersStore.setError(null)

      const response = await fetch("/api/customer/orders", {
        method: "GET",
        headers: authHeaders(token),
      })
      if (!response.ok) throw new Error("Failed to fetch orders")

      const data = await response.json()
      const orders: Order[] = (data.data ?? []).map((o: Record<string, unknown>) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        paidAt: o.paidAt ? new Date(o.paidAt as string) : null,
        pickupDeadline: o.pickupDeadline ? new Date(o.pickupDeadline as string) : null,
        createdAt: new Date(o.createdAt as string),
        updatedAt: new Date(o.updatedAt as string),
        items: ((o.items as Record<string, unknown>[]) ?? []).map((item: Record<string, unknown>) => ({
          ...item,
          createdAt: new Date(item.createdAt as string),
        })),
      })) as Order[]

      ordersStore.setOrders(orders)
      return orders
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      ordersStore.setError(message)
      console.error("Failed to fetch orders:", error)
      throw error
    } finally {
      ordersStore.setLoading(false)
    }
  }, [user, token, ordersStore])

  /**
   * Create a new order from cart
   * @param paymentMethod - "cash" or "gcash"
   * @param branch - Customer's selected branch
   * @param notes - Optional order notes
   */
  const createOrder = useCallback(
    async (paymentMethod: "cash" | "gcash", branch: string, notes?: string) => {
      if (!user) throw new Error("User not authenticated")

      if (!token) throw new Error("No authentication token found")

      try {
        ordersStore.setLoading(true)
        ordersStore.setError(null)

        const response = await fetch("/api/customer/orders", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ paymentMethod, branch, notes }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            errorData.message || "Failed to create order"
          )
        }

        const data = await response.json()
        const payload = data.data ?? {}
        const orderPayload = payload.order ?? {}
        const order: Order = {
          ...orderPayload,
          totalAmount: Number(orderPayload.totalAmount),
          paidAt: orderPayload.paidAt ? new Date(orderPayload.paidAt) : null,
          pickupDeadline: orderPayload.pickupDeadline ? new Date(orderPayload.pickupDeadline) : null,
          createdAt: new Date(orderPayload.createdAt),
          updatedAt: new Date(orderPayload.updatedAt),
          items: (orderPayload.items as Record<string, unknown>[] ?? []).map((item: Record<string, unknown>) => ({
            ...item,
            createdAt: new Date(item.createdAt as string),
          })),
        }

        ordersStore.addOrder(order)
        return order
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        ordersStore.setError(message)
        console.error("Failed to create order:", error)
        throw error
      } finally {
        ordersStore.setLoading(false)
      }
    },
    [user, token, ordersStore]
  )

  /**
   * Cancel an order
   */
  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!user) throw new Error("User not authenticated")
      if (!token) throw new Error("No authentication token found")

      try {
        ordersStore.setLoading(true)
        ordersStore.setError(null)

        const response = await fetch(`/api/customer/orders/${orderId}`, {
          method: "PATCH",
          headers: authHeaders(token ?? ""),
          body: JSON.stringify({ status: "cancelled" }),
        })

        if (!response.ok) throw new Error("Failed to cancel order")

        ordersStore.updateOrder(orderId, { status: "cancelled" })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        ordersStore.setError(message)
        console.error("Failed to cancel order:", error)
        throw error
      } finally {
        ordersStore.setLoading(false)
      }
    },
    [user, token, ordersStore]
  )

  /**
   * Delete an order from transaction history
   */
  const deleteOrder = useCallback(
    async (orderId: string) => {
      if (!user) throw new Error("User not authenticated")
      if (!token) throw new Error("No authentication token found")

      try {
        ordersStore.setLoading(true)
        ordersStore.setError(null)

        const response = await fetch(`/api/customer/orders/${orderId}`, {
          method: "DELETE",
          headers: authHeaders(token ?? ""),
        })

        if (!response.ok) {
          const data = await response.json()

          // 404 = order is already deleted on the server, treat as success
          if (response.status === 404) {
            ordersStore.removeOrder(orderId)
            return
          }

          throw new Error(data.message || "Failed to delete order")
        }

        ordersStore.removeOrder(orderId)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        ordersStore.setError(message)
        console.error("Failed to delete order:", error)
        throw error
      } finally {
        ordersStore.setLoading(false)
      }
    },
    [user, token, ordersStore]
  )

  return {
    // State
    orders: ordersStore.orders,
    currentOrder: ordersStore.currentOrder,
    isLoading: ordersStore.isLoading,
    error: ordersStore.error,

    // Actions
    fetchOrders,
    createOrder,
    cancelOrder,
    deleteOrder,
  }
}
