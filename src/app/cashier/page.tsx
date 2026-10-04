"use client"

import { useState } from "react"
import { ProductCatalog } from "@/features/cashier-dashboard/components/product-catalog"
import { CartSidebar } from "@/features/cashier-dashboard/components/cart-sidebar"
import { CashDrawerModal } from "@/features/cashier-dashboard/components/cash-drawer-modal"
import { useCart } from "@/features/cashier-dashboard/hooks/use-cart"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"
import { useCashDrawer } from "@/features/cashier-dashboard/hooks/use-cash-drawer"
import { Wallet, ShoppingCart, ChevronRight } from "lucide-react"

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

      {/* Prominent Mobile Bottom Cart Bar */}
      {!isCartOpen && cart.items.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 z-30 flex items-center justify-between rounded-2xl border border-primary/20 bg-card/95 p-3 shadow-2xl backdrop-blur-md transition-all lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm">
                {cart.items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Current Cart ({cart.items.reduce((sum, i) => sum + i.quantity, 0)})
              </p>
              <p className="font-mono text-base font-black text-primary">
                ₱{cart.total.toFixed(2)}
              </p>
            </div>
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
          >
            View Cart
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
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
          onScanSuccess={() => setIsCartOpen(true)}
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
