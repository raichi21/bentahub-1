import { useCallback, useRef } from "react"
import { useCartStore, type CartItem } from "@/stores/cartStore"
import { useAuth } from "./useAuth"

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

/**
 * Minimal product data used for the optimistic add-to-cart path.
 * When provided, the item appears in the cart immediately and the server
 * round-trip reconciles it afterwards (instead of blocking the UI).
 */
export interface CartItemSnapshot {
  productName: string
  price: number
  image?: string | null
  category?: string | null
}

function createTempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Cart actions only — consumers that only need to mutate the cart
 * (e.g. ProductCard) subscribe to no cart state, so they don't
 * re-render when the cart changes.
 */
export function useCartActions() {
  const { user, token } = useAuth()
  const fetchingRef = useRef(false)

  /**
   * Fetch cart from backend
   */
  const fetchCart = useCallback(async () => {
    if (!user || !token) return
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const state = useCartStore.getState()
      state.setLoading(true)
      state.setError(null)

      const response = await fetch("/api/customer/cart", {
        method: "GET",
        headers: authHeaders(token),
      })
      if (!response.ok) throw new Error("Failed to fetch cart")

      const data = await response.json()
      const items: CartItem[] = data.data.items.map((item: Record<string, unknown>) => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        addedAt: new Date(item.addedAt as string),
        updatedAt: new Date(item.updatedAt as string),
      })) as CartItem[]

      useCartStore.getState().setItems(items)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      useCartStore.getState().setError(message)
      console.error("Failed to fetch cart:", error)
    } finally {
      fetchingRef.current = false
      useCartStore.getState().setLoading(false)
    }
  }, [user, token])

  /**
   * Add item to cart.
   * If a product `snapshot` is provided the item is added optimistically
   * (instant UI) and reconciled with the server response. On failure the
   * optimistic change is rolled back.
   */
  const addToCart = useCallback(
    async (productId: string, quantity: number, branch: string, snapshot?: CartItemSnapshot) => {
      if (!user || !token) return

      // ── Optimistic update ──
      let optimisticId: string | null = null
      let previous: CartItem | undefined

      if (snapshot) {
        const state = useCartStore.getState()
        previous = state.items.find((i) => i.productId === productId)

        if (previous) {
          // Merge into the existing row (keep its server id)
          optimisticId = previous.id
          const price = Number(snapshot.price)
          const mergedQuantity = previous.quantity + quantity
          state.updateItem(previous.id, {
            quantity: mergedQuantity,
            subtotal: Number((mergedQuantity * price).toFixed(2)),
          })
        } else {
          const price = Number(snapshot.price)
          const optimisticItem: CartItem = {
            id: createTempId(),
            productId,
            productName: snapshot.productName,
            price,
            quantity,
            subtotal: Number((price * quantity).toFixed(2)),
            image: snapshot.image ?? "",
            category: snapshot.category ?? "",
            branch,
            addedAt: new Date(),
            updatedAt: new Date(),
          }
          optimisticId = optimisticItem.id
          state.addItem(optimisticItem)
        }
      }

      try {
        const response = await fetch("/api/customer/cart", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ productId, quantity, branch }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.message || "Failed to add item to cart")
        }

        const data = await response.json()
        const serverItem: CartItem = {
          ...data.data,
          price: Number(data.data.price),
          subtotal: Number(data.data.subtotal),
          addedAt: new Date(data.data.addedAt),
          updatedAt: new Date(data.data.updatedAt),
        }

        // Reconcile: replace the optimistic row with the authoritative row
        useCartStore.getState().addItem(serverItem)
        return serverItem
      } catch (error) {
        // Rollback optimistic changes
        if (snapshot) {
          const state = useCartStore.getState()
          if (previous) {
            state.updateItem(previous.id, {
              quantity: previous.quantity,
              subtotal: previous.subtotal,
            })
          } else if (optimisticId) {
            state.removeItem(optimisticId)
          }
        }
        const message = error instanceof Error ? error.message : "Unknown error"
        useCartStore.getState().setError(message)
        console.error("Failed to add to cart:", error)
        throw error
      }
    },
    [user, token]
  )

  /**
   * Update cart item quantity
   */
  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user || !token) return

      try {
        useCartStore.getState().setError(null)

        const response = await fetch(`/api/customer/cart/${itemId}`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({ quantity }),
        })

        if (!response.ok) throw new Error("Failed to update cart item")

        const data = await response.json()
        useCartStore.getState().updateItem(itemId, {
          quantity: data.data.quantity,
          subtotal: Number(data.data.subtotal),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        useCartStore.getState().setError(message)
        console.error("Failed to update cart item:", error)
        throw error
      }
    },
    [user, token]
  )

  /**
   * Remove item from cart
   */
  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!user || !token) return

      try {
        useCartStore.getState().setError(null)

        const response = await fetch(`/api/customer/cart/${itemId}`, {
          method: "DELETE",
          headers: authHeaders(token),
        })

        if (!response.ok) throw new Error("Failed to remove item from cart")

        useCartStore.getState().removeItem(itemId)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        useCartStore.getState().setError(message)
        console.error("Failed to remove from cart:", error)
        throw error
      }
    },
    [user, token]
  )

  const clearCart = useCallback(() => {
    useCartStore.getState().clearCart()
  }, [])

  return { fetchCart, addToCart, updateCartItem, removeFromCart, clearCart }
}

/**
 * Cart state + actions. Uses selectors so consumers only re-render
 * when the slices they read actually change.
 */
export function useCart() {
  const actions = useCartActions()
  const items = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.itemCount)
  const total = useCartStore((s) => s.total)
  const isLoading = useCartStore((s) => s.isLoading)
  const error = useCartStore((s) => s.error)

  return {
    // State
    items,
    itemCount,
    total,
    isLoading,
    error,

    // Actions
    ...actions,
  }
}
