"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Minus, 
  Plus, 
  Trash2, 
  HelpCircle, 
  ShoppingCart,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useCartStore } from "@/stores/cartStore"
import { SERVICE_FEE_RATE, RESERVATION_BOND } from "@/lib/fees"
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
  const { items, total, isLoading, error, fetchCart, updateCartItem, removeFromCart } = useCart()
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
    router.push(`/customer/checkout?branch=${encodeURIComponent(items[0]?.branch || user?.branch || "Lourdes Main Branch")}`)
  }

  const subtotal = Number(total) || 0
  const serviceFee = +(subtotal * SERVICE_FEE_RATE).toFixed(2)
  const bond = RESERVATION_BOND
  const totalDue = subtotal + serviceFee + bond

  return (
    <div className="max-w-6xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground text-lg">Loading cart...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <p className="text-muted-foreground text-lg">Your cart is empty</p>
            <Button onClick={() => router.push("/catalog")}>
              Continue Shopping
            </Button>
          </div>
        )
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Item List & Schedule */}
          <div className="flex-1 space-y-6 w-full">
            {/* Items Section */}
            <section className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
              <div className="p-4 bg-muted border-b border-border flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Product Details</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity</span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const atMax = item.availableStock != null && item.quantity >= item.availableStock
                  return (
                  <div key={item.id} className="p-6 flex items-center gap-6 group">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
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
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate">{item.productName}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                      <p className="font-mono text-primary font-bold mt-2">₱{Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center border border-border rounded-lg overflow-hidden h-10">
                        <button
                          onClick={() => handleDecrement(item.id)}
                          className="px-3 hover:bg-muted transition-colors h-full flex items-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          className="w-12 text-center border-x border-border bg-transparent font-mono text-foreground h-full"
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onBlur={() => handleQuantityBlur(item.id)}
                        />
                        <button
                          onClick={() => handleIncrement(item.id)}
                          disabled={atMax}
                          title={atMax ? "Maximum stock reached" : undefined}
                          className={cn(
                            "px-3 transition-colors h-full flex items-center",
                            atMax ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
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
                        className="text-destructive text-xs hover:underline flex items-center gap-1"
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
          <aside className="w-full lg:w-96 sticky top-24">
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-foreground">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Service Fee</span>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </div>
                  <span className="font-mono text-foreground">₱{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reservation Bond</span>
                  <span className="font-mono text-foreground">₱{bond.toFixed(2)}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total Due</span>
                  <span className="text-2xl font-bold text-primary">₱{totalDue.toFixed(2)}</span>
                </div>

              </div>
              <div className="space-y-3">
                <Button
                  className="w-full bg-primary text-white py-4 rounded-lg font-bold active:scale-[0.99] transition-all shadow-sm hover:brightness-110"
                  onClick={handleCheckout}
                  disabled={isProcessing || items.length === 0}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout"}
                </Button>
                <button
                  onClick={() => router.push("/catalog")}
                  className="w-full bg-transparent border border-border text-muted-foreground py-4 rounded-lg font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
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
