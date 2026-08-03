"use client"

import { useState } from "react"
import { ProductCatalog } from "@/features/cashier-dashboard/components/product-catalog"
import { CartSidebar } from "@/features/cashier-dashboard/components/cart-sidebar"
import { useCart } from "@/features/cashier-dashboard/hooks/use-cart"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"
import { ShoppingCart } from "lucide-react"

export default function CashierPage() {
  const { products, isLoading, error, refetch } = useCashierProducts()
  const cart = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

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
          <CartSidebar cart={cart} onClose={() => setIsCartOpen(false)} onSaleComplete={refetch} />
        </div>
      </div>
    </div>
  )
}
