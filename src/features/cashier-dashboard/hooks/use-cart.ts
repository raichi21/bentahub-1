"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { usePolling } from "@/hooks/use-polling"
import { useCartStream } from "@/hooks/use-cart-stream"
import type { Product, CartItem } from "@/types/cashier"

/**
 * Slow safety-net poll. Supabase Realtime (`useCartStream`) is the primary
 * update path — a scan on the phone reaches the register in <1s with zero
 * Vercel cost. This poll only covers gaps the stream cannot: missing Supabase
 * env, a revoked/expired socket, or a missed event.
 */
export const CART_FALLBACK_POLL_MS = 60_000

/**
 * The cashier "current sale" cart. No longer local-only: it is persisted
 * server-side and synced realtime, so the phone (scanner) and the computer
 * (display + checkout) share one cart as long as both are signed into the
 * same cashier. The `UseCartReturn` shape is unchanged so every renderer
 * keeps working.
 *
 * Sync is event-driven: Supabase Realtime pushes the moment any device's
 * change commits to the database, with a slow 60s fallback poll as safety net.
 *
 * Mutations are optimistic — the UI updates instantly from the action itself
 * and reconciles with the server in the background (fire-and-forget reload +
 * the stream/fallback reloads), instead of freezing for several seconds per
 * click.
 */
export function useCart() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [amountPaid, setAmountPaid] = useState<string>("")

  // Sequence counter: bumped on every load AND every mutation.
  // Stale GET responses resolving after a newer action are discarded.
  const loadSeqRef = useRef(0)

  // Track active in-flight user mutations (addItem, removeItem, updateQuantity).
  // While > 0, background reloads will NOT overwrite local optimistic state.
  const pendingMutationsRef = useRef(0)

  // While a clear is in flight (DELETE /api/cashier/cart), ignore reload responses.
  const pendingClearRef = useRef(false)

  const loadCart = useCallback(async () => {
    if (!token) return
    // If a mutation or clear is currently in flight, don't overwrite optimistic UI with a stale server snapshot
    if (pendingMutationsRef.current > 0 || pendingClearRef.current) return

    const seq = ++loadSeqRef.current
    try {
      const res = await fetch("/api/cashier/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()

      // If a mutation happened while this request was in flight, abort!
      if (seq !== loadSeqRef.current) return
      if (pendingMutationsRef.current > 0 || pendingClearRef.current) return

      if (Array.isArray(json.data?.items)) {
        setItems(json.data.items)
      }
    } catch {
      // Keep the last known cart; the next reload retries.
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) return loadCart()
    })
    return () => {
      cancelled = true
    }
  }, [token, loadCart])

  useCartStream(loadCart, token ?? null, user?.userId ?? null)

  // Safety net only — the stream above is the primary update path.
  usePolling(loadCart, token ? CART_FALLBACK_POLL_MS : null)

  const addItem = useCallback(
    (product: Product): boolean => {
      if (product.stock <= 0) return false

      // 1. Immediately invalidate any pending GET requests so they cannot overwrite this add
      loadSeqRef.current++
      pendingMutationsRef.current++

      // 2. Instant optimistic update (0ms)
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.product.id === product.id)
        if (existingIdx >= 0) {
          const existing = prev[existingIdx]
          if (product.stock > 0 && existing.quantity >= product.stock) {
            return prev
          }
          const next = [...prev]
          next[existingIdx] = {
            ...existing,
            quantity: existing.quantity + 1,
          }
          return next
        }
        return [...prev, { product, quantity: 1 }]
      })

      // 3. Persist to server in background
      if (token) {
        void fetch("/api/cashier/cart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.id }),
        })
          .then(async (res) => {
            if (!res.ok) {
              if (pendingMutationsRef.current <= 1) {
                void loadCart()
              }
              return
            }
            const json = await res.json()
            // Reconcile with the exact server quantity (light POST response).
            // Only when this is the last in-flight mutation.
            if (
              pendingMutationsRef.current <= 1 &&
              !pendingClearRef.current &&
              typeof json?.data?.quantity === "number"
            ) {
              const serverQty = json.data.quantity as number
              setItems((prev) =>
                prev.map((i) =>
                  i.product.id === product.id
                    ? { ...i, quantity: serverQty }
                    : i
                )
              )
            }
          })
          .catch(() => {
            if (pendingMutationsRef.current <= 1) {
              void loadCart()
            }
          })
          .finally(() => {
            pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
          })
      } else {
        pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
      }

      return true
    },
    [token, loadCart]
  )

  const removeItem = useCallback(
    (productId: string) => {
      loadSeqRef.current++
      pendingMutationsRef.current++

      // Instant optimistic state update
      setItems((prev) => prev.filter((i) => i.product.id !== productId))

      if (!token) {
        pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
        return
      }

      void fetch(`/api/cashier/cart/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok && pendingMutationsRef.current <= 1) {
            void loadCart()
          }
        })
        .catch(() => {
          if (pendingMutationsRef.current <= 1) {
            void loadCart()
          }
        })
        .finally(() => {
          pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
        })
    },
    [token, loadCart]
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      loadSeqRef.current++
      pendingMutationsRef.current++

      let effective = quantity
      setItems((prev) => {
        const item = prev.find((i) => i.product.id === productId)
        if (!item) return prev
        effective = Math.max(1, Math.min(quantity, item.product.stock))
        if (effective === item.quantity) return prev

        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: effective } : i
        )
      })

      if (!token) {
        pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
        return
      }

      void fetch(`/api/cashier/cart/${productId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: effective }),
      })
        .then((res) => {
          if (!res.ok && pendingMutationsRef.current <= 1) {
            void loadCart()
          }
        })
        .catch(() => {
          if (pendingMutationsRef.current <= 1) {
            void loadCart()
          }
        })
        .finally(() => {
          pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1)
        })
    },
    [token, loadCart]
  )

  const clearCart = useCallback(() => {
    loadSeqRef.current++
    setItems([])
    setAmountPaid("")
    if (!token) return
    pendingClearRef.current = true
    void fetch("/api/cashier/cart", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .catch(() => {})
      .finally(() => {
        pendingClearRef.current = false
        loadSeqRef.current++
      })
  }, [token])

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const total = subtotal

  const paidNum = parseFloat(amountPaid) || 0
  const changeDue = paidNum >= total ? paidNum - total : 0

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    amountPaid,
    setAmountPaid,
    subtotal,
    total,
    changeDue,
  }
}
export type UseCartReturn = ReturnType<typeof useCart>
