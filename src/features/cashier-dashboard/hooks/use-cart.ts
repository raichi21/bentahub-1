"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { usePolling } from "@/hooks/use-polling"
import type { Product, CartItem } from "@/types/cashier"

/** How often every connected cashier device refreshes the shared cart, so a
 *  barcode scanned on a phone appears on the register within this window. */
export const CART_POLL_INTERVAL_MS = 3000

/**
 * The cashier "current sale" cart. No longer local-only: it is persisted
 * server-side and polled, so the phone (scanner) and the computer (display +
 * checkout) share one cart as long as both are signed into the same cashier.
 * The `UseCartReturn` shape is unchanged so every renderer keeps working.
 */
export function useCart() {
  const { token } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [amountPaid, setAmountPaid] = useState<string>("")

  // Latest request wins — a slow GET resolving after a newer one must not
  // overwrite fresher state during quick consecutive actions.
  const loadSeqRef = useRef(0)
  // While a clear is in flight (DELETE /api/cashier/cart), ignore poll
  // responses so the stale pre-clear cart can't flicker back in right after
  // CANCEL ORDER or a completed sale.
  const pendingClearRef = useRef(false)

  const loadCart = useCallback(async () => {
    if (!token) return
    const seq = ++loadSeqRef.current
    try {
      const res = await fetch("/api/cashier/cart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      if (seq !== loadSeqRef.current) return
      if (pendingClearRef.current) return
      setItems(Array.isArray(json.data?.items) ? json.data.items : [])
    } catch {
      // Keep the last known cart; the next poll tick retries.
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    // Load in a microtask so no setState happens synchronously in the effect.
    void Promise.resolve().then(() => {
      if (!cancelled) return loadCart()
    })
    return () => {
      cancelled = true
    }
  }, [token, loadCart])

  usePolling(loadCart, CART_POLL_INTERVAL_MS)

  const addItem = useCallback(
    async (product: Product): Promise<boolean> => {
      if (product.stock <= 0) return false
      try {
        const res = await fetch("/api/cashier/cart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.id }),
        })
        if (!res.ok) return false
        await loadCart()
        return true
      } catch {
        return false
      }
    },
    [token, loadCart]
  )

  const removeItem = useCallback(
    (productId: string) => {
      void (async () => {
        if (!token) return
        try {
          await fetch(`/api/cashier/cart/${productId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch {
          // Ignore — the next poll reconciles.
        } finally {
          await loadCart()
        }
      })()
    },
    [token, loadCart]
  )

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const item = items.find((i) => i.product.id === productId)
      if (!item) return
      const effective = Math.max(1, Math.min(quantity, item.product.stock))
      if (effective === item.quantity) return
      void (async () => {
        if (!token) return
        try {
          await fetch(`/api/cashier/cart/${productId}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ quantity: effective }),
          })
        } catch {
          // Ignore — the next poll reconciles.
        } finally {
          await loadCart()
        }
      })()
    },
    [items, token, loadCart]
  )

  const clearCart = useCallback(() => {
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
        void loadCart()
      })
  }, [token, loadCart])

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
