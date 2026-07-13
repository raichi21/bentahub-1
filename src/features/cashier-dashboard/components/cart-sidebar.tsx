"use client"

import { useEffect, useState, useCallback } from "react"
import { ShoppingCart, QrCode, Coins, CheckCircle, Percent, X, Loader2 } from "lucide-react"
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
}

export function CartSidebar({ cart, onClose }: CartSidebarProps) {
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
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [gcashPayment, setGcashPayment] = useState<{
    checkoutUrl: string
    amount: number
    receiptNumber: number
    paymentIntentId: string
    transactionId: string
  } | null>(null)

  const completeSale = useCallback(async () => {
    if (items.length === 0) return

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
      setSuccessMsg(
        `Transaction completed! Total: ₱${total.toFixed(2)}`
      )
      setCheckoutSuccess(true)
      clearCart()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Transaction failed")
    } finally {
      setSubmitting(false)
    }
  }, [items, amountPaid, total, paymentMethod, discountPercent, discountAmount, subtotal, changeDue, token, clearCart])

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
  }, [items, amountPaid, total, paymentMethod, completeSale, clearCart, submitting])

  return (
    <aside className="w-full lg:w-[520px] bg-card border-l border-border flex flex-col z-20 overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.03)] h-full relative">
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
          }}
          onClose={() => setGcashPayment(null)}
        />
      )}

      {/* Success Toast */}
      {checkoutSuccess && !lastTransaction && (
        <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-lg text-card-foreground mb-1">Sale Complete</h3>
          <p className="text-xs text-muted-foreground max-w-xs">{successMsg}</p>
          <button
            onClick={() => setCheckoutSuccess(false)}
            className="mt-6 px-5 py-2 bg-foreground text-background rounded-xl text-xs font-bold hover:opacity-80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary font-bold" />
          <h2 className="font-bold text-lg text-card-foreground">Orders</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-muted rounded text-muted-foreground">
            {items.length} Items
          </span>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors lg:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-card">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 text-muted-foreground/40" />
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
      <div className="bg-muted/80 p-4 border-t border-border flex flex-col gap-3">
        {/* Subtotal & Discount info */}
        <div className="space-y-1 bg-card p-3 rounded-xl border border-border/60 shadow-2xs">
          <div className="flex justify-between text-muted-foreground text-xs font-medium">
            <span>Subtotal</span>
            <span className="font-mono">₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground text-xs font-medium min-h-[28px]">
            <span>Discount</span>
            {showPromoInput ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ""}
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    setDiscountPercent(val)
                  }}
                  onBlur={() => {
                    if (!discountPercent) setShowPromoInput(false)
                  }}
                  className="w-12 px-1 py-0.5 text-center font-mono text-xs border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0"
                  autoFocus
                />
                <Percent className="w-3 h-3 text-muted-foreground" />
              </div>
            ) : (
              <button
                onClick={() => setShowPromoInput(true)}
                className="text-primary hover:underline font-bold text-xs"
              >
                {discountPercent > 0 ? `${discountPercent}% Off` : "Add Promo"}
              </button>
            )}
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-border mt-2">
            <span className="text-xs font-bold text-card-foreground">Total Amount</span>
            <span className="text-2xl font-black text-primary font-mono">
              ₱{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-2xl border border-border gap-2">
          <button
            onClick={() => {
              setPaymentMethod("cash")
              setAmountPaid("")
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all duration-200",
              paymentMethod === "cash"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Coins className="w-6 h-6" />
            <span className="text-[10px] tracking-wider uppercase font-bold">Cash</span>
          </button>
          <button
            onClick={() => {
              setPaymentMethod("gcash")
              setAmountPaid(total.toFixed(2)) // GCash is always exact amount
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold transition-all duration-200",
              paymentMethod === "gcash"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <QrCode className="w-6 h-6" />
            <span className="text-[10px] tracking-wider uppercase font-bold">GCash</span>
          </button>
        </div>

        {/* Payment Details Form */}
        <div className="bg-card rounded-2xl border border-border p-3 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Amount Paid
            </label>
          </div>
          <div className="flex items-baseline gap-1 border-b border-border pb-1.5">
            <span className="text-2xl font-bold text-muted-foreground/40 font-mono">₱</span>
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
              className="w-full border-none p-0 text-2xl font-black font-mono text-card-foreground focus:ring-0 placeholder:text-muted-foreground/20 bg-transparent outline-none"
            />
          </div>
          {paymentMethod === "cash" && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                Change Due
              </span>
              <span className="text-xl font-black font-mono text-amber-600">
                ₱{changeDue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Action button trigger blocks */}
        <div className="flex flex-col gap-1.5 pt-0.5">
          <button
            disabled={items.length === 0 || submitting}
            onClick={completeSale}
            className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-black text-base shadow-xl shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {submitting ? "PROCESSING..." : "COMPLETE SALE (ENTER)"}
          </button>
          <button
            disabled={items.length === 0 || submitting}
            onClick={clearCart}
            className="w-full bg-transparent text-muted-foreground hover:text-red-500 hover:bg-red-50 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Discard Transaction (ESC)
          </button>
        </div>
      </div>
    </aside>
  )
}
