"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useCartStore } from "@/stores/cartStore"
import { MAX_ITEM_QUANTITY } from "@/lib/cart"
import { cn } from "@/lib/utils"
import { RoleGate } from "@/components/role-gate"

export default function CartPage() {
  return (
    <RoleGate allow={["customer"]}>
      <CartPageInner />
    </RoleGate>
  )
}

function CartPageInner() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    items,
    total,
    isLoading,
    error,
    fetchCart,
    updateCartItem,
    removeFromCart,
  } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // All cart mutations are optimistic: the store updates instantly and the
  // server syncs in the background (see useCartActions). No disabled states.

  // Read the freshest quantity from the store rather than the render
  // closure, so rapid +/- taps each compute from the latest value instead
  // of firing duplicate requests with the same stale quantity.
  const getLatestQuantity = (itemId: string, fallback: number) => {
    const latest = useCartStore.getState().items.find((i) => i.id === itemId)
    return latest ? latest.quantity : fallback
  }

  const handleIncrement = async (itemId: string) => {
    const latest = useCartStore.getState().items.find((i) => i.id === itemId)
    if (!latest) return
    const max = latest.availableStock ?? MAX_ITEM_QUANTITY
    const base = getLatestQuantity(itemId, latest.quantity)
    // Cap at the branch's available stock so the + can never overshoot the
    // stock limit and trigger a server rejection + rollback.
    await updateCartItem(itemId, Math.min(base + 1, max))
  }

  const handleDecrement = async (itemId: string) => {
    const latest = useCartStore.getState().items.find((i) => i.id === itemId)
    if (!latest || latest.quantity <= 1) return
    await updateCartItem(itemId, latest.quantity - 1)
  }

  const handleRemove = async (itemId: string) => {
    await removeFromCart(itemId)
  }

  const handleQuantityChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1) {
      // Optimistic — server sync is debounced inside the hook
      updateCartItem(itemId, num)
    }
  }

  // Clamp a manually typed quantity back into [1, availableStock] when the
  // field loses focus, so a typed over-stock value is corrected instead of
  // erroring server-side.
  const handleQuantityBlur = (itemId: string) => {
    const latest = useCartStore.getState().items.find((i) => i.id === itemId)
    if (!latest) return
    const max = latest.availableStock ?? MAX_ITEM_QUANTITY
    const clamped = Math.min(Math.max(latest.quantity, 1), max)
    if (clamped !== latest.quantity) {
      updateCartItem(itemId, clamped)
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    setIsProcessing(true)
    router.push(
      `/customer/checkout?branch=${encodeURIComponent(items[0]?.branch || user?.branch || "Lourdes Main Branch")}`
    )
  }

  const subtotal = Number(total) || 0

  return (
    <div className="mx-auto max-w-6xl">
      {error && (
        <div className="mb-6 rounded border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        isLoading ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Loading cart...</p>
          </div>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => router.push("/customer/catalog")}>
              Continue Shopping
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row">
          {/* Left: Item List & Schedule */}
          <div className="w-full flex-1 space-y-6">
            {/* Items Section */}
            <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted p-4">
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Product Details
                </span>
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Quantity
                </span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const atMax =
                    item.availableStock != null &&
                    item.quantity >= item.availableStock
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-6 p-6"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {item.image && (
                          <Image
                            alt={item.productName}
                            src={item.image}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold text-foreground">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                        </p>
                        <p className="mt-2 font-mono font-bold text-primary">
                          ₱{Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex h-10 items-center overflow-hidden rounded-lg border border-border">
                          <button
                            onClick={() => handleDecrement(item.id)}
                            className="flex h-full items-center px-3 transition-colors hover:bg-muted"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            className="h-full w-12 border-x border-border bg-transparent text-center font-mono text-foreground"
                            type="text"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(item.id, e.target.value)
                            }
                            onBlur={() => handleQuantityBlur(item.id)}
                          />
                          <button
                            onClick={() => handleIncrement(item.id)}
                            disabled={atMax}
                            title={atMax ? "Maximum stock reached" : undefined}
                            className={cn(
                              "flex h-full items-center px-3 transition-colors",
                              atMax
                                ? "cursor-not-allowed opacity-40"
                                : "hover:bg-muted"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {atMax && (
                          <span className="text-[10px] text-muted-foreground">
                            Max {item.availableStock} in stock
                          </span>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* Right: Order Summary (Sticky) */}
          <aside className="sticky top-24 w-full lg:w-96">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-foreground">
                Order Summary
              </h3>
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-mono text-foreground">
                    ₱{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mb-8 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    Total Due
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ₱{subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full rounded-lg bg-primary py-4 font-bold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.99]"
                  onClick={handleCheckout}
                  disabled={isProcessing || items.length === 0}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout"}
                </Button>
                <button
                  onClick={() => router.push("/customer/catalog")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-4 font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
