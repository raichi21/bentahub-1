"use client"

import { useState, useMemo, useEffect } from "react"
import { ProductCatalog } from "@/features/cashier-dashboard/components/product-catalog"
import { CartSidebar } from "@/features/cashier-dashboard/components/cart-sidebar"
import { useCart } from "@/features/cashier-dashboard/hooks/use-cart"
import { ShoppingCart } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffProductItem } from "@/types/staff"

export default function CashierPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchProducts() {
      try {
        const res = await fetch("/api/staff/products", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load products")

        const json = await res.json()

        if (cancelled) return

        const mapped: Product[] = (json.data?.products || []).map(
          (p: StaffProductItem) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            category: p.category as Product["category"],
            stock: p.stock,
            reorderLevel: p.reorderLevel,
            image: p.image || "",
            unit: "pcs",
          }),
        )
        setProducts(mapped)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) setFetched(true)
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const cart = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const isLoading = authLoading || (token !== null && !fetched && !error)

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      {!isCartOpen && cart.items.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-4 z-20 lg:hidden bg-primary text-primary-foreground p-4 rounded-full shadow-lg shadow-primary/30 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm font-bold">{cart.items.length}</span>
        </button>
      )}

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <ProductCatalog
          products={products}
          isLoading={isLoading}
          error={error}
          onAddProduct={cart.addItem}
        />
      </div>

      <div className={`${isCartOpen ? 'fixed inset-0 z-40 lg:static lg:inset-auto' : 'hidden lg:block'} lg:h-full`}>
        {isCartOpen && (
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/50 lg:hidden" />
        )}
        <div className={`${isCartOpen ? 'relative z-10 h-full' : 'h-full'} w-full lg:w-auto`}>
          <CartSidebar cart={cart} onClose={() => setIsCartOpen(false)} />
        </div>
      </div>
    </div>
  )
}
