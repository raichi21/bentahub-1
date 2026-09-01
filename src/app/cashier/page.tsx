"use client"

import { useState } from "react"
import { ProductCatalog } from "@/features/cashier-dashboard/components/product-catalog"
import { CartSidebar } from "@/features/cashier-dashboard/components/cart-sidebar"
import { CashDrawerModal } from "@/features/cashier-dashboard/components/cash-drawer-modal"
import { useCart } from "@/features/cashier-dashboard/hooks/use-cart"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"
import { useCashDrawer } from "@/features/cashier-dashboard/hooks/use-cash-drawer"
import { Wallet, ShoppingCart } from "lucide-react"

export default function CashierPage() {
  const { products, isLoading, error, refetch } = useCashierProducts()
  const cart = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"open" | "close" | null>(null)
  const [suppressPrompt, setSuppressPrompt] = useState(false)
  const drawer = useCashDrawer()

  const hasOpenSession = !!drawer.session && drawer.session.status === "open"

  // Auto-prompt to open a cash drawer when there is no open session after the initial load.
  const autoPromptOpen = !drawer.isLoading && !hasOpenSession && !suppressPrompt

  const handleOpened = async (startingCash: number, notes?: string) => {
    await drawer.openShift(startingCash, notes)
    setDrawerMode(null)
  }

  const handleClosed = async (actualEndingCash: number, notes?: string) => {
    await drawer.closeShift(actualEndingCash, notes)
    setDrawerMode(null)
    setSuppressPrompt(true)
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      {drawerMode && (
        <CashDrawerModal
          mode={drawerMode}
          session={drawer.session}
          lastClosedSession={drawer.lastClosedSession}
          isLoading={drawer.isLoading}
          onOpen={handleOpened}
          onCloseShift={handleClosed}
          onDismiss={() => setDrawerMode(null)}
        />
      )}

      {autoPromptOpen && !drawerMode && (
        <CashDrawerModal
          mode="open"
          session={null}
          lastClosedSession={drawer.lastClosedSession}
          isLoading={drawer.isLoading}
          onOpen={async (startingCash, notes) => {
            await drawer.openShift(startingCash, notes)
          }}
          onCloseShift={async () => {}}
          onDismiss={() => setSuppressPrompt(true)}
        />
      )}

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
        <div className="p-4 pb-0 flex items-center justify-end">
          <button
            onClick={() => setDrawerMode(hasOpenSession ? "close" : "open")}
            disabled={drawer.isLoading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 border ${
              hasOpenSession
                ? "border-border text-muted-foreground hover:bg-muted"
                : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/15"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            {hasOpenSession ? "Close Cash Drawer" : "Open Cash Drawer"}
          </button>
        </div>

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
          <CartSidebar cart={cart} onClose={() => setIsCartOpen(false)} onSaleComplete={refetch} canAcceptCash={drawer.canAcceptCash} />
        </div>
      </div>
    </div>
  )
}
