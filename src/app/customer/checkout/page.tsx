"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  CheckCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useOrders } from "@/hooks/useOrders"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const branch = searchParams.get("branch") || "Main Branch"

  const { items, total, clearCart } = useCart()
  const { createOrder, isLoading } = useOrders()

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [notes, setNotes] = useState("")
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) {
      router.push("/customer/cart")
    }
  }, [items, router])

  const handleSubmitOrder = async () => {
    try {
      setOrderError(null)

      const order = await createOrder(paymentMethod, branch, notes)
      setCreatedOrderId(order.id)
      setOrderSuccess(true)

      // Clear cart after successful order
      setTimeout(() => {
        clearCart()
        setTimeout(() => {
          router.push("/customer/orders")
        }, 1500)
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order"
      setOrderError(message)
      console.error("Order creation failed:", err)
    }
  }

  const subtotal = total
  const serviceFee = +(subtotal * 0.01).toFixed(2)
  const bond = 50.00
  const totalDue = subtotal + serviceFee + bond

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Order Submitted!</h2>
            <p className="text-muted-foreground mt-2">Your order has been successfully created.</p>
            {createdOrderId && (
              <p className="text-sm text-muted-foreground mt-1">Order ID: <span className="font-mono text-foreground">{createdOrderId}</span></p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>
        <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        <p className="text-muted-foreground mt-1">Complete your order details</p>
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
            <h2 className="text-lg font-bold text-foreground mb-4">Pickup Branch</h2>
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="font-semibold text-foreground">{branch}</p>
              <p className="text-sm text-muted-foreground mt-1">Bulacan Branch</p>
            </div>
            <Link
              href={`/customer/cart?branch=${encodeURIComponent(branch)}`}
              className="text-primary text-sm hover:underline mt-3 inline-block"
            >
              Change Branch
            </Link>
          </section>

          {/* Payment Method */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setPaymentMethod("cash")}>
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "gcash")}
                  className="w-4 h-4"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Cash</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Pay at pickup location</p>
                </div>
              </label>

              <label className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setPaymentMethod("gcash")}>
                <input
                  type="radio"
                  name="payment"
                  value="gcash"
                  checked={paymentMethod === "gcash"}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "gcash")}
                  className="w-4 h-4"
                />
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">GCash</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Mobile payment via GCash</p>
                </div>
              </label>
            </div>
          </section>

          {/* Order Notes */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Additional Notes (Optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requests or notes for your order..."
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
            />
          </section>

          {/* Order Items Summary */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Order Items</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {item.productName} <span className="text-foreground font-mono">x{item.quantity}</span>
                  </span>
                  <span className="text-foreground font-mono">₱{(item.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Order Summary (Sticky) */}
        <aside className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-mono text-foreground">₱{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Reservation Bond</span>
                <span className="font-mono text-foreground">₱{bond.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border mb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Total Due</span>
                <span className="text-xl font-bold text-primary">₱{totalDue.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={isLoading}
              className="w-full bg-primary text-white py-4 rounded-lg font-bold active:scale-[0.99] transition-all shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm Order"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By confirming, you agree to our terms and conditions
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
