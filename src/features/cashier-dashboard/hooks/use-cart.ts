"use client"

import { useState } from "react"
import type { Product, CartItem } from "@/types/cashier"

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [discountPercent, setDiscountPercent] = useState<number>(0)

  const addItem = (product: Product) => {
    if (product.stock <= 0) return

    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        // Guard against stock limit
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock
          const targetQty = Math.min(quantity, maxStock)
          return { ...item, quantity: targetQty }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
    setAmountPaid("")
    setDiscountPercent(0)
  }

  // Computed totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const discountAmount = (subtotal * discountPercent) / 100
  const total = Math.max(0, subtotal - discountAmount)

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
    discountPercent,
    setDiscountPercent,
    subtotal,
    discountAmount,
    total,
    changeDue,
  }
}
export type UseCartReturn = ReturnType<typeof useCart>
