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

  // Per-item pending quantity syncs. Each entry debounces the PUT so rapid
  // +/- taps coalesce into a single server call, and remembers the last
  // server-confirmed values so a failure can roll the row back.
  interface PendingQuantitySync {
    timer: ReturnType<typeof setTimeout> | null
    /** Bumped on every optimistic edit; a stale PUT response is ignored unless it still matches the version captured when the request was dispatched. */
    version: number
    lastGoodQuantity: number
    lastGoodSubtotal: number
  }
  const quantitySyncsRef = useRef<Map<string, PendingQuantitySync>>(new Map())

  /** productIds with an add-to-cart POST still in flight. */
  const pendingAddsRef = useRef<Map<string, number>>(new Map())
  /** productIds removed while their add was still in flight — the add's reconcile cleans up the server row and stays out of the store. */
  const pendingRemovesRef = useRef<Set<string>>(new Set())

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

      // Merge instead of replacing wholesale: a row the server hasn't
      // confirmed yet (an add still in flight, or one that landed after this
      // fetch started) would otherwise be wiped and make a freshly added
      // item flicker out. Rows the user removed are already gone from the
      // store, so they aren't resurrected.
      const serverProducts = new Set(items.map((i) => i.productId))
      const current = useCartStore.getState()
      const preserved = current.items.filter((i) => {
        if (!serverProducts.has(i.productId)) return true
        return (pendingAddsRef.current.get(i.productId) ?? 0) > 0
      })
      const preservedProducts = new Set(preserved.map((i) => i.productId))
      const serverItems = items.filter((i) => !preservedProducts.has(i.productId))
      useCartStore.getState().setItems([...preserved, ...serverItems])
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
      if (!user || !token) {
        // Reject loudly instead of silently no-oping: a tap during session
        // hydration would otherwise flash "Added" while adding nothing.
        throw new Error("Your session is still loading — please try again in a moment")
      }

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

      // Track the in-flight add so fetchCart won't wipe the optimistic row
      // and a remove during the round-trip is honored.
      pendingAddsRef.current.set(productId, (pendingAddsRef.current.get(productId) ?? 0) + 1)

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

        if (pendingRemovesRef.current.has(productId)) {
          // The user removed this item before the add landed — clean up the
          // server row silently instead of re-adding it to the store.
          void fetch(`/api/customer/cart/${serverItem.id}`, {
            method: "DELETE",
            headers: authHeaders(token),
          }).catch(() => {})
          return serverItem
        }

        // Reconcile: adopt the authoritative row, but never let a stale
        // response shrink a quantity the user added while this request was
        // in flight. The newer quantity stays, with the real server id.
        const current = useCartStore.getState()
        const existing = current.items.find((i) => i.productId === productId)
        if (existing && Number(serverItem.quantity) < existing.quantity) {
          current.addItem({
            ...serverItem,
            quantity: existing.quantity,
            subtotal: Number((existing.quantity * Number(serverItem.price)).toFixed(2)),
          })
        } else {
          current.addItem(serverItem)
        }
        return serverItem
      } catch (error) {
        // Rollback optimistic changes — unless the user removed the row while
        // the add was in flight, in which case keep it gone.
        if (snapshot && !pendingRemovesRef.current.has(productId)) {
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
      } finally {
        const remaining = (pendingAddsRef.current.get(productId) ?? 1) - 1
        if (remaining <= 0) pendingAddsRef.current.delete(productId)
        else pendingAddsRef.current.set(productId, remaining)
        pendingRemovesRef.current.delete(productId)
      }
  },
    [user, token]
  )

  /**
   * Update cart item quantity — OPTIMISTIC.
   * The store updates instantly so +/- taps and typing feel immediate;
   * the server PUT is debounced (~500ms) and coalesced per item. On
   * failure the row rolls back to the last server-confirmed values.
   * A per-item version guard ignores stale in-flight responses so an
   * older request can never overwrite a newer edit.
   */
  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user || !token) return

      const state = useCartStore.getState()
      state.setError(null)

      const item = state.items.find((i) => i.id === itemId)
      if (!item) return

      const synced = quantitySyncsRef.current.get(itemId) ?? {
        timer: null,
        version: 0,
        lastGoodQuantity: item.quantity,
        lastGoodSubtotal: item.subtotal,
      }
      // Mark this as a new edit so any response from an earlier request
      // becomes stale and is ignored.
      synced.version++

      // ── Optimistic: apply instantly (store recomputes the subtotal) ──
      state.updateItem(itemId, { quantity })

      // ── Debounced server sync (one PUT with the final quantity) ──
      if (synced.timer) clearTimeout(synced.timer)
      synced.timer = setTimeout(async () => {
        const current = quantitySyncsRef.current.get(itemId)
        if (!current) return
        // Capture this request's edit version in a LOCAL so a later edit
        // that bumps `current.version` (or a second timer that fires while
        // this request is in flight) can never make this response pass the
        // staleness check. The shared object's fields are NOT safe here.
        const requestVersion = current.version
        try {
          const response = await fetch(`/api/customer/cart/${itemId}`, {
            method: "PUT",
            headers: authHeaders(token),
            body: JSON.stringify({ quantity }),
          })

          if (!response.ok) throw new Error("Failed to update cart item")

          const data = await response.json()
          // Adopt the authoritative values from the server — only if no
          // newer edit happened while this request was in flight.
          if (current.version === requestVersion) {
            useCartStore.getState().updateItem(itemId, {
              quantity: data.data.quantity,
              subtotal: Number(data.data.subtotal),
            })
            current.lastGoodQuantity = Number(data.data.quantity)
            current.lastGoodSubtotal = Number(data.data.subtotal)
          }
        } catch (error) {
          // Roll back to the last server-confirmed values — only if this
          // request is still the newest edit for the item; otherwise the
          // newer debounced request owns the row.
          if (current.version === requestVersion) {
            useCartStore.getState().updateItem(itemId, {
              quantity: current.lastGoodQuantity,
              subtotal: current.lastGoodSubtotal,
            })
          }
          const message = error instanceof Error ? error.message : "Unknown error"
          useCartStore.getState().setError(message)
          console.error("Failed to update cart item:", error)
        }
      }, 500)

      quantitySyncsRef.current.set(itemId, synced)
    },
    [user, token]
  )

  /**
   * Remove item from cart — OPTIMISTIC.
   * The row disappears instantly; the DELETE runs in the background and
   * the item is restored on failure.
   */
  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!user || !token) return

      // Cancel any pending quantity sync for this item first
      const pending = quantitySyncsRef.current.get(itemId)
      if (pending?.timer) clearTimeout(pending.timer)
      quantitySyncsRef.current.delete(itemId)

      const state = useCartStore.getState()
      state.setError(null)

      const previous = state.items.find((i) => i.id === itemId)
      if (!previous) return

      // ── Optimistic: remove instantly ──
      state.removeItem(itemId)

      // If this row is a pending add (its POST is still in flight), the
      // add's reconcile cleans up the server row and keeps it out of the
      // store — no DELETE needed here (the temp row has no server id).
      if ((pendingAddsRef.current.get(previous.productId) ?? 0) > 0) {
        pendingRemovesRef.current.add(previous.productId)
        return
      }

      try {
        const response = await fetch(`/api/customer/cart/${itemId}`, {
          method: "DELETE",
          headers: authHeaders(token),
        })

        if (!response.ok) throw new Error("Failed to remove item from cart")
      } catch (error) {
        // Restore the item on failure
        const current = useCartStore.getState()
        if (!current.items.some((i) => i.id === itemId)) {
          current.addItem(previous)
        }
        const message = error instanceof Error ? error.message : "Unknown error"
        current.setError(message)
        console.error("Failed to remove from cart:", error)
      }
    },
    [user, token]
  )

  const clearCart = useCallback(() => {
    // Cancel pending quantity syncs so no ghost PUTs fire after clearing
    quantitySyncsRef.current.forEach((sync) => {
      if (sync.timer) clearTimeout(sync.timer)
    })
    quantitySyncsRef.current.clear()
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
