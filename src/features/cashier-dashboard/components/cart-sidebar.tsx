"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ShoppingCart,
  QrCode,
  Coins,
  CheckCircle,
  Percent,
  X,
  Loader2,
} from "lucide-react"
import { CartItem } from "./cart-item"
import { ReceiptModal } from "./receipt-modal"
import { GcashPaymentModal } from "./gcash-payment-modal"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { UseCartReturn } from "../hooks/use-cart"
import type { Transaction } from "@/types/cashier"

interface CartSidebarProps {
  cart: UseCartReturn
  onClose?: () => void
  onSaleComplete?: () => void
  canAcceptCash?: boolean
}

export function CartSidebar({
  cart,
  onClose,
  onSaleComplete,
  canAcceptCash = true,
}: CartSidebarProps) {
  const { token, user } = useAuth()
  const {
    items,
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
  } = cart

  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [showPromoInput, setShowPromoInput] = useState(discountPercent > 0)
  const [submitting, setSubmitting] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(
    null
  )
  const [gcashPayment, setGcashPayment] = useState<{
    checkoutUrl: string
    amount: number
    receiptNumber: number
    paymentIntentId: string
    transactionId: string
  } | null>(null)

  // If cash drawer is not open, never leave the payment method on cash.
  useEffect(() => {
    if (!canAcceptCash && paymentMethod === "cash") {
      setPaymentMethod("gcash")
      setAmountPaid("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAcceptCash, paymentMethod])

  const completeSale = useCallback(async () => {
    if (items.length === 0) return

    if (paymentMethod === "cash" && !canAcceptCash) {
      alert("Please open a cash drawer session first.")
      return
    }

    if (paymentMethod === "gcash") {
      setSubmitting(true)
      try {
        const res = await fetch("/api/cashier/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items,
            totalAmount: total,
            discountPercent,
          }),
        })

        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.message || "Payment failed")
        }

        setGcashPayment({
          checkoutUrl: json.data.checkoutUrl,
          amount: json.data.amount,
          receiptNumber: json.data.receiptNumber,
          paymentIntentId: json.data.paymentIntentId,
          transactionId: json.data.transactionId,
        })
      } catch (err) {
        alert(err instanceof Error ? err.message : "Payment failed")
      } finally {
        setSubmitting(false)
      }
      return
    }

    const paidVal = parseFloat(amountPaid) || 0
    if (paidVal < total && paymentMethod === "cash") {
      alert("Insufficient payment amount!")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/cashier/transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          totalAmount: total,
          paymentMethod,
          amountPaid: amountPaid || "0",
          changeDue,
          discountPercent,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || "Transaction failed")
      }

      const transaction: Transaction = {
        id: json.data.id,
        receiptNumber: json.data.receiptNumber,
        date: new Date().toISOString(),
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          qty: item.quantity,
          price: item.product.price,
        })),
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        amountPaid: paidVal,
        change: changeDue,
        cashier: user?.fullName || "Cashier",
        status: "completed",
      }

      setLastTransaction(transaction)
      setSuccessMsg(`Transaction completed! Total: ₱${total.toFixed(2)}`)
      setCheckoutSuccess(true)
      clearCart()
      onSaleComplete?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Transaction failed")
    } finally {
      setSubmitting(false)
    }
  }, [
    items,
    amountPaid,
    total,
    paymentMethod,
    discountPercent,
    discountAmount,
    subtotal,
    changeDue,
    token,
    clearCart,
    onSaleComplete,
    user,
    canAcceptCash,
  ])

  // Keyboard action shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        const activeTag = document.activeElement?.tagName.toLowerCase()
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault()
          completeSale()
        }
      }
      if (e.key === "Escape" && !submitting) {
        e.preventDefault()
        clearCart()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    items,
    amountPaid,
    total,
    paymentMethod,
    completeSale,
    clearCart,
    submitting,
  ])

  return (
    <aside className="relative z-20 flex h-full w-full flex-col overflow-hidden border-l border-border bg-card shadow-[-10px_0_30px_rgba(0,0,0,0.03)] lg:w-[520px]">
      {/* Receipt Modal */}
      {lastTransaction && (
        <ReceiptModal
          transaction={lastTransaction}
          onClose={() => setLastTransaction(null)}
        />
      )}

      {/* GCash Payment Modal */}
      {gcashPayment && (
        <GcashPaymentModal
          checkoutUrl={gcashPayment.checkoutUrl}
          amount={gcashPayment.amount}
          receiptNumber={gcashPayment.receiptNumber}
          paymentIntentId={gcashPayment.paymentIntentId}
          transactionId={gcashPayment.transactionId}
          token={token}
          onSuccess={() => {
            const transaction: Transaction = {
              id: gcashPayment.transactionId,
              receiptNumber: gcashPayment.receiptNumber,
              date: new Date().toISOString(),
              items: items.map((item) => ({
                productId: item.product.id,
                name: item.product.name,
                qty: item.quantity,
                price: item.product.price,
              })),
              subtotal,
              discount: discountAmount,
              total,
              paymentMethod: "gcash",
              amountPaid: total,
              change: 0,
              cashier: user?.fullName || "Cashier",
              status: "completed",
            }
            setGcashPayment(null)
            setLastTransaction(transaction)
            setSuccessMsg(`Payment received! Total: ₱${total.toFixed(2)}`)
            setCheckoutSuccess(true)
            clearCart()
            onSaleComplete?.()
          }}
          onClose={() => setGcashPayment(null)}
        />
      )}

      {/* Success Toast */}
      {checkoutSuccess && !lastTransaction && (
        <div className="animate-fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-6 text-center backdrop-blur-sm">
          <div className="mb-4 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h3 className="mb-1 text-lg font-bold text-card-foreground">
            Sale Complete
          </h3>
          <p className="max-w-xs text-xs text-muted-foreground">{successMsg}</p>
          <button
            onClick={() => setCheckoutSuccess(false)}
            className="mt-6 rounded-xl bg-foreground px-5 py-2 text-xs font-bold text-background transition-colors hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sidebar Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 font-bold text-primary" />
          <h2 className="text-lg font-bold text-card-foreground">Orders</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {items.length} Items
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-card p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingCart className="mb-2 h-12 w-12 stroke-[1.5] text-muted-foreground/40" />
            <span className="text-xs font-medium">Cart is empty</span>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onUpdateQty={(q) => updateQuantity(item.product.id, q)}
              onRemove={() => removeItem(item.product.id)}
            />
          ))
        )}
      </div>

      {/* Checkout Panel */}
      <div className="flex flex-col gap-3 border-t border-border bg-muted/80 p-4">
        {/* Subtotal & Discount info */}
        <div className="space-y-1 rounded-xl border border-border/60 bg-card p-3 shadow-2xs">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex min-h-[28px] items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Discount</span>
            {showPromoInput ? (
              <div className="animate-fade-in flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ""}
                  onChange={(e) => {
                    const val = Math.min(
                      100,
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                    setDiscountPercent(val)
                  }}
                  onBlur={() => {
                    if (!discountPercent) setShowPromoInput(false)
                  }}
                  className="w-12 rounded border border-border px-1 py-0.5 text-center font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="0"
                  autoFocus
                />
                <Percent className="h-3 w-3 text-muted-foreground" />
              </div>
            ) : (
              <button
                onClick={() => setShowPromoInput(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {discountPercent > 0 ? `${discountPercent}% Off` : "Add Promo"}
              </button>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
            <span className="text-xs font-bold text-card-foreground">
              Total Amount
            </span>
            <span className="font-mono text-2xl font-black text-primary">
              ₱{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Options */}
        {!canAcceptCash && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-600">
            Cash payment needs an open cash drawer session. Open one from the
            top bar, or use GCash.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted p-1">
          <button
            onClick={() => {
              setPaymentMethod("cash")
              setAmountPaid("")
            }}
            disabled={!canAcceptCash}
            title={
              !canAcceptCash ? "Open a cash drawer session first" : undefined
            }
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold transition-all duration-200",
              paymentMethod === "cash"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground hover:bg-muted",
              !canAcceptCash && "cursor-not-allowed opacity-40 hover:bg-card"
            )}
          >
            <Coins className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              Cash
            </span>
          </button>
          <button
            onClick={() => {
              setPaymentMethod("gcash")
              setAmountPaid(total.toFixed(2)) // GCash is always exact amount
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 font-bold transition-all duration-200",
              paymentMethod === "gcash"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              GCash
            </span>
          </button>
        </div>

        {/* Payment Details Form */}
        <div className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
              Amount Paid
            </label>
          </div>
          <div className="flex items-baseline gap-1 border-b border-border pb-1.5">
            <span className="font-mono text-2xl font-bold text-muted-foreground/40">
              ₱
            </span>
            <input
              type="text"
              placeholder="0.00"
              value={amountPaid}
              disabled={paymentMethod === "gcash"}
              onChange={(e) => {
                // Ensure only decimals
                const val = e.target.value
                if (/^\d*\.?\d*$/.test(val)) {
                  setAmountPaid(val)
                }
              }}
              className="w-full border-none bg-transparent p-0 font-mono text-2xl font-black text-card-foreground outline-none placeholder:text-muted-foreground/20 focus:ring-0"
            />
          </div>
          {paymentMethod === "cash" && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold tracking-tight text-muted-foreground uppercase">
                Change Due
              </span>
              <span className="font-mono text-xl font-black text-amber-600">
                ₱{changeDue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Action button trigger blocks */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <button
            disabled={items.length === 0 || submitting || !!gcashPayment}
            onClick={completeSale}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-3 text-base font-black text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {submitting ? "PROCESSING..." : "COMPLETE SALE"}
          </button>
          <button
            disabled={items.length === 0 || submitting}
            onClick={clearCart}
            className="w-full rounded-xl bg-transparent py-1.5 text-sm font-bold text-muted-foreground transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
          >
            CANCEL ORDER
          </button>
        </div>
      </div>
    </aside>
  )
}
