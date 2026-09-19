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
    <div className="relative flex h-full flex-1 overflow-hidden">
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
          className="fixed right-4 bottom-6 z-20 flex items-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 lg:hidden"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-sm font-bold">{cart.items.length}</span>
        </button>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-end p-4 pb-0">
          <button
            onClick={() => setDrawerMode(hasOpenSession ? "close" : "open")}
            disabled={drawer.isLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
              hasOpenSession
                ? "border-border text-muted-foreground hover:bg-muted"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
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

      <div
        className={`${isCartOpen ? "fixed inset-0 z-40 lg:static lg:inset-auto" : "hidden lg:block"} lg:h-full`}
      >
        {isCartOpen && (
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 lg:hidden"
          />
        )}
        <div
          className={`${isCartOpen ? "relative z-10 h-full" : "h-full"} w-full lg:w-auto`}
        >
          <CartSidebar
            cart={cart}
            onClose={() => setIsCartOpen(false)}
            onSaleComplete={refetch}
            canAcceptCash={drawer.canAcceptCash}
          />
        </div>
      </div>
    </div>
  )
}
