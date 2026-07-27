"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  CheckCircle,
  X,
  Loader2,
  Store,
  FileText,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useOrders } from "@/hooks/useOrders"
import { SERVICE_FEE_RATE, RESERVATION_BOND } from "@/lib/fees"
import Link from "next/link"
import { cn, formatOrderId } from "@/lib/utils"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  const branch = searchParams.get("branch") || user?.branch || "Lourdes Main Branch"

  const { items, total, clearCart, isLoading: cartLoading } = useCart()
  const { createOrder, isLoading } = useOrders()

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [notes, setNotes] = useState("")
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderSuccess) {
      router.push("/customer/cart")
    }
  }, [items, cartLoading, router, orderSuccess])

  const handleSubmitOrder = async () => {
    try {
      setOrderError(null)

      // Reuse existing order ID if payment was retried after a failure
      let orderId = createdOrderId
      if (!orderId) {
        const order = await createOrder(paymentMethod, branch, notes)
        setCreatedOrderId(order.id)
        orderId = order.id
      }

      if (paymentMethod === "cash") {
        // Set orderSuccess FIRST so the empty-cart redirect guard (useEffect)
        // sees orderSuccess=true and doesn't redirect to /customer/cart
        setOrderSuccess(true)
        clearCart()
        return
      }

      setIsRedirecting(true)

      const res = await fetch("/api/customer/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || "Failed to initiate GCash payment")
      }

      const checkoutUrl = json.data?.checkoutUrl
      if (checkoutUrl) {
        // #14: Clear local cart BEFORE redirect so stale items don't persist
        clearCart()
        window.location.href = checkoutUrl
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process order"
      setOrderError(message)
      setOrderSuccess(false)
      setIsRedirecting(false)
      console.error("Order processing failed:", err)
    }
  }

  const subtotal = total
  const serviceFee = +(subtotal * SERVICE_FEE_RATE).toFixed(2)
  const bond = RESERVATION_BOND
  const totalDue = subtotal + serviceFee + bond

  // Compute pickup deadline: today at 5PM, or tomorrow at 5PM if past 5PM
  const pickupDeadline = new Date()
  pickupDeadline.setHours(17, 0, 0, 0)
  if (new Date() >= pickupDeadline) {
    pickupDeadline.setDate(pickupDeadline.getDate() + 1)
  }
  const formattedDeadline = pickupDeadline.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const formattedDeadlineDate = pickupDeadline.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <div className="p-1 rounded-lg border border-border group-hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back to Cart</span>
        </button>
      </header>

      {orderError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">{orderError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Branch */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-muted-foreground" />
              Pickup Branch
            </h2>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{branch}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pickup available until <strong>{formattedDeadline}</strong> ({formattedDeadlineDate})
                </p>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                {paymentMethod === "cash" && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  paymentMethod === "cash" ? "bg-primary/10" : "bg-muted"
                )}>
                  <Banknote className={cn(
                    "h-6 w-6",
                    paymentMethod === "cash" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-bold text-foreground">Cash</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pay at pickup</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("gcash")}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center",
                  paymentMethod === "gcash"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                {paymentMethod === "gcash" && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  paymentMethod === "gcash" ? "bg-primary/10" : "bg-muted"
                )}>
                  <CreditCard className={cn(
                    "h-6 w-6",
                    paymentMethod === "gcash" ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="font-bold text-foreground">GCash</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Mobile payment</p>
                </div>
              </button>
            </div>
          </section>

          {/* Order Notes */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Additional Notes <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requests or notes for your order..."
              className="w-full p-3.5 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm"
              rows={3}
            />
          </section>

          {/* Order Items Summary */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              Order Items
              <span className="ml-auto text-sm font-normal text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </h2>
            <div className="divide-y divide-border max-h-56 overflow-y-auto -mx-1">
              {items.map((item, idx) => (
                <div key={item.id} className={cn(
                  "flex justify-between items-center py-3 px-1 rounded-lg",
                  idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{item.quantity}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">₱{Number(item.price).toFixed(2)} each</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground font-mono shrink-0 ml-4">₱{(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Order Summary (Sticky) */}
        <aside className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Order Summary
            </h3>

            {/* Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-mono text-foreground">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Fee (1%)</span>
                <span className="text-sm font-mono text-foreground">₱{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reservation Bond</span>
                <span className="text-sm font-mono text-foreground">₱{bond.toFixed(2)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-border mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Total Due</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">₱{totalDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <Button
              onClick={handleSubmitOrder}
              disabled={isLoading || isRedirecting}
              size="lg"
              className="w-full bg-primary text-white py-6 rounded-xl font-bold text-base active:scale-[0.98] transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
            >
              {isRedirecting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to PayMongo...
                </span>
              ) : isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Proceed to Checkout
                </span>
              )}
            </Button>

          </div>
        </aside>
      </div>

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-6 shadow-2xl border border-border relative">
            {/* Close button */}
            <button
              onClick={() => setOrderSuccess(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Static checkmark */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Order info */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Order Submitted!</h2>
              <p className="text-muted-foreground">Your order has been placed successfully.</p>
              {createdOrderId && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Order ID:</span>
                  <span className="text-sm font-mono font-bold text-foreground">{formatOrderId(createdOrderId)}</span>
                </div>
              )}
            </div>

            {/* Pickup Deadline */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg text-sm text-center">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                ⏰ Pickup deadline: <strong>{formattedDeadline}</strong> ({formattedDeadlineDate})
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Reserve must be claimed before 5:00 PM or it will be cancelled.
              </p>
            </div>

            {/* Button */}
            <Link href="/customer/orders">
              <Button className="w-full h-12 text-base font-bold" size="lg">
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
