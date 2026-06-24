"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { StaffKpiCards } from "@/features/staff-dashboard/components/staff-kpi-cards"
import { staffProducts, getStockStatus } from "@/features/staff-dashboard/data/products"
import { AlertTriangle, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/cashier"

const STORAGE_KEY = "bentahub-staff-products"

export default function StaffPage() {
  const [products, setProducts] = useState<Product[]>(staffProducts)

  // Load from localStorage only after hydration to avoid mismatches
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProducts(JSON.parse(stored))
      } catch {
        // fall back to default
      }
    }
  }, [])

  const lowStockCount = useMemo(() => products.filter((p) => getStockStatus(p) === "low-stock" || getStockStatus(p) === "out-of-stock").length, [products])

  const lowStockItems = useMemo(() => products.filter((p) => getStockStatus(p) === "low-stock" || getStockStatus(p) === "out-of-stock").slice(0, 5), [products])

  const recentChanges = useMemo(() => products.filter((p) => p.stock < 10).slice(0, 5), [products])

  return (
    <div className="space-y-6">
      <StaffKpiCards
        products={products}
        lowStockCount={lowStockCount}
        pendingPickups={3}
        todayRevenue={3650.50}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-foreground">Low Stock Alerts</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{lowStockCount} items</span>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Product Code: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-mono font-bold", p.stock === 0 ? "text-red-600" : "text-amber-600")}>
                      {p.stock} {p.unit}s
                    </p>
                    <p className="text-[10px] text-muted-foreground">Min: {p.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">

              <h2 className="text-base font-bold text-foreground">Recent Stock Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Today</span>
          </div>
          {recentChanges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent stock changes.</p>
          ) : (
            <div className="space-y-3">
              {recentChanges.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted overflow-hidden border border-border/50 flex-shrink-0 flex items-center justify-center">
                      {p.image ? (
                        <Image src={p.image} alt={p.name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-foreground">{p.stock} {p.unit}s</p>
                    <p className="text-[10px] text-muted-foreground">{getStockStatus(p) === "low-stock" ? "Low Stock" : "Running Low"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-bold text-foreground">System & Operational Alerts</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <p className="text-xs text-green-700">All systems operational — POS, Inventory, and Payment services running normally.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <p className="text-xs text-amber-700">Re-stock reminder: 3 products below minimum threshold. Check Inventory page.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
