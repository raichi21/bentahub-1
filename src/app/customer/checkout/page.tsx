"use client"

import { useEffect, useState, Suspense } from "react"
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
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useOrders } from "@/hooks/useOrders"
import Link from "next/link"
import { cn, formatOrderId } from "@/lib/utils"
import { RoleGate } from "@/components/role-gate"

export default function CheckoutPage() {
  return (
    <RoleGate allow={["customer"]}>
      <Suspense fallback={<CheckoutLoading />}>
        <CheckoutPageInner />
      </Suspense>
    </RoleGate>
  )
}

function CheckoutLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  )
}

function CheckoutPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  const branch =
    searchParams.get("branch") || user?.branch || "Lourdes Main Branch"

  const {
    items,
    total,
    clearCart,
    isLoading: cartLoading,
    fetchCart,
  } = useCart()
  const { createOrder, isLoading } = useOrders()

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [orderError, setOrderError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate the cart from the server so a hard refresh on this page
  // doesn't briefly see an empty cart and bounce the user back.
  useEffect(() => {
    fetchCart().finally(() => setHydrated(true))
  }, [fetchCart])

  useEffect(() => {
    if (!cartLoading && hydrated && items.length === 0 && !orderSuccess) {
      router.push("/customer/cart")
    }
  }, [items, cartLoading, router, orderSuccess, hydrated])

  const handleSubmitOrder = async () => {
    try {
      setOrderError(null)

      if (!phone.trim()) {
        setOrderError("Phone number is required")
        return
      }

      if (!/^09\d{9}$/.test(phone.trim())) {
        setOrderError("Phone number must be 11 digits starting with 09")
        return
      }

      // Reuse existing order ID if payment was retried after a failure
      let orderId = createdOrderId
      if (!orderId) {
        const order = await createOrder(
          paymentMethod,
          branch,
          phone.trim(),
          notes
        )
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
      const message =
        err instanceof Error ? err.message : "Failed to process order"
      setOrderError(message)
      setOrderSuccess(false)
      setIsRedirecting(false)
      console.error("Order processing failed:", err)
    }
  }

  const subtotal = total

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
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <button
          onClick={() => router.back()}
          className="group mb-4 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <div className="rounded-lg border border-border p-1 transition-colors group-hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Back to Cart</span>
        </button>
      </header>

      {orderError && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">{orderError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Checkout Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Pickup Branch */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <Store className="h-5 w-5 text-muted-foreground" />
              Pickup Branch
            </h2>
            <div className="flex items-center gap-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{branch}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pickup available until <strong>{formattedDeadline}</strong> (
                  {formattedDeadlineDate})
                </p>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all",
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                {paymentMethod === "cash" && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    paymentMethod === "cash" ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <Banknote
                    className={cn(
                      "h-6 w-6",
                      paymentMethod === "cash"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div>
                  <p className="font-bold text-foreground">Cash</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pay at pickup
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("gcash")}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all",
                  paymentMethod === "gcash"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                {paymentMethod === "gcash" && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    paymentMethod === "gcash" ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <CreditCard
                    className={cn(
                      "h-6 w-6",
                      paymentMethod === "gcash"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <div>
                  <p className="font-bold text-foreground">GCash</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Mobile payment
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Phone Number */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Phone Number
            </h2>
            <input
              type="tel"
              value={phone}
              maxLength={11}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11)
                setPhone(val)
                if (val && !/^09\d{0,9}$/.test(val)) {
                  setPhoneError("Must start with 09")
                } else {
                  setPhoneError(null)
                }
              }}
              placeholder="09XXXXXXXXX"
              className={`w-full rounded-xl border bg-background p-3.5 text-sm text-foreground placeholder-muted-foreground/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none ${
                phoneError ? "border-red-500" : "border-border"
              }`}
            />
            {phoneError ? (
              <p className="mt-2 text-xs text-red-500">{phoneError}</p>
            ) : phone.length > 0 && phone.length < 11 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {phone.length}/11 digits
              </p>
            ) : phone.length === 11 ? (
              <p className="mt-2 text-xs text-green-600">11/11 digits ✓</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                We&apos;ll text or call you when your item is ready for pickup.
              </p>
            )}
          </section>

          {/* Order Notes */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Additional Notes{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (Optional)
              </span>
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requests or notes for your order..."
              className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm text-foreground placeholder-muted-foreground/60 transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
              rows={3}
            />
          </section>

          {/* Order Items Summary */}
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              Order Items
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <div className="-mx-1 max-h-56 divide-y divide-border overflow-y-auto">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-1 py-3",
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₱{Number(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <span className="ml-4 shrink-0 font-mono text-sm font-bold text-foreground">
                    ₱{item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Order Summary (Sticky) */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Order Summary
            </h3>

            {/* Breakdown */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-mono text-sm text-foreground">
                  ₱{subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Total Due</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">
                    ₱{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <Button
              onClick={handleSubmitOrder}
              disabled={isLoading || isRedirecting || !/^09\d{9}$/.test(phone)}
              size="lg"
              className="w-full rounded-xl bg-primary py-6 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setOrderSuccess(false)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Static checkmark */}
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/30">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Order info */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Order Submitted!
              </h2>
              <p className="text-muted-foreground">
                Your order has been placed successfully.
              </p>
              {createdOrderId && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2">
                  <span className="text-sm text-muted-foreground">
                    Order ID:
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {formatOrderId(createdOrderId)}
                  </span>
                </div>
              )}
            </div>

            {/* Pickup Deadline */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm dark:border-amber-800/50 dark:bg-amber-950/40">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                ⏰ Pickup deadline: <strong>{formattedDeadline}</strong> (
                {formattedDeadlineDate})
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Reserve must be claimed before 5:00 PM or it will be cancelled.
              </p>
            </div>

            {/* Button */}
            <Link href="/customer/reservations">
              <Button className="h-12 w-full text-base font-bold" size="lg">
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
