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
      const orders: Order[] = (data.data ?? []).map((o: any) => ({
        ...o,
        paidAt: o.paidAt ? new Date(o.paidAt) : null,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
        items: o.items?.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })) || [],
      }))

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
  }, [user, token])

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
          paidAt: orderPayload.paidAt ? new Date(orderPayload.paidAt) : null,
          createdAt: new Date(orderPayload.createdAt),
          updatedAt: new Date(orderPayload.updatedAt),
          items: orderPayload.items?.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          })) || [],
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
  }
}
