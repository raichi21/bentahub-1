"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Minus, 
  Plus, 
  Trash2, 
  MapPin, 
  Info, 
  HelpCircle, 
  Bookmark, 
  ShieldCheck 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"

export default function CartPage() {
  const router = useRouter()
  const { items, total, isLoading, error, fetchCart, updateCartItem, removeFromCart } = useCart()
  const [selectedBranch, setSelectedBranch] = useState<string>("Main Branch")
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleIncrement = async (itemId: string, currentQuantity: number) => {
    try {
      await updateCartItem(itemId, Math.min(currentQuantity + 1, 99))
    } catch (err) {
      console.error("Failed to increment:", err)
    }
  }

  const handleDecrement = async (itemId: string, currentQuantity: number) => {
    try {
      if (currentQuantity > 1) {
        await updateCartItem(itemId, currentQuantity - 1)
      }
    } catch (err) {
      console.error("Failed to decrement:", err)
    }
  }

  const handleRemove = async (itemId: string) => {
    try {
      await removeFromCart(itemId)
    } catch (err) {
      console.error("Failed to remove:", err)
    }
  }

  const handleQuantityChange = async (itemId: string, value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= 99) {
      try {
        await updateCartItem(itemId, num)
      } catch (err) {
        console.error("Failed to update quantity:", err)
      }
    }
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    router.push(`/customer/checkout?branch=${encodeURIComponent(selectedBranch)}`)
  }

  const subtotal = Number(total) || 0
  const serviceFee = +(subtotal * 0.01).toFixed(2)
  const bond = 50.00
  const totalDue = subtotal + serviceFee + bond

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-foreground">Carts</h2>
        <p className="text-muted-foreground mt-1">Review your selected items before submitting your reservation request.</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground text-lg">Your cart is empty</p>
          <Button onClick={() => router.push("/customer/catalog")}>
            Continue Shopping
          </Button>
        </div>
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
                {items.map((item) => (
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
                          onClick={() => handleDecrement(item.id, item.quantity)}
                          disabled={isLoading}
                          className="px-3 hover:bg-muted transition-colors h-full flex items-center disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          className="w-12 text-center border-x border-border bg-transparent font-mono text-foreground h-full"
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          disabled={isLoading}
                        />
                        <button
                          onClick={() => handleIncrement(item.id, item.quantity)}
                          disabled={isLoading}
                          className="px-3 hover:bg-muted transition-colors h-full flex items-center disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={isLoading}
                        className="text-destructive text-xs hover:underline flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pickup Schedule Section */}
            <section className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">Pickup Location</h3>
                  <p className="text-base text-foreground mt-1">{selectedBranch}</p>
                  <p className="text-sm text-muted-foreground">Bulacan Branch</p>
                  <div className="mt-4 p-4 bg-muted rounded-lg border border-primary/10 flex gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-muted-foreground italic">Note: You will be asked to select a specific date and time window for your pickup on the next confirmation step.</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/customer/catalog")}
                  className="text-primary text-sm font-bold hover:underline shrink-0"
                >
                  Change Branch
                </button>
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
                <p className="text-xs text-muted-foreground mt-2 text-right">Includes VAT where applicable</p>
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
                  onClick={() => router.push("/customer/catalog")}
                  className="w-full bg-transparent border border-border text-muted-foreground py-4 rounded-lg font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Continue Shopping
                </button>
              </div>
              <div className="mt-8 p-4 rounded-lg border border-border bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Secure Reservation</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reservation bonds are fully refundable if the items are unavailable or if the reservation is canceled within the grace period.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
