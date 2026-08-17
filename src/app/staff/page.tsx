"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { KPICard } from "@/features/admin-dashboard"
import { getStockStatus } from "@/lib/staff-utils"
import { Package, AlertTriangle, ShoppingBag, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffDashboardData, StaffProductItem } from "@/types/staff"

export default function StaffPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [dashboard, setDashboard] = useState<StaffDashboardData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchData() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        const [dashboardRes, productsRes] = await Promise.all([
          fetch("/api/staff/dashboard", { headers }),
          fetch("/api/staff/products", { headers }),
        ])

        if (!dashboardRes.ok || !productsRes.ok) {
          throw new Error("Failed to load dashboard data")
        }

        const dashboardJson = await dashboardRes.json()
        const productsJson = await productsRes.json()

        if (cancelled) return

        setDashboard(dashboardJson.data)

        const mappedProducts: Product[] = (productsJson.data?.products || []).map(
          (p: StaffProductItem) => ({
            id: p.id,
            sku: p.sku,
            barcode: p.barcode,
            name: p.name,
            price: p.price,
            category: p.category as Product["category"],
            stock: p.stock,
            reorderLevel: p.reorderLevel,
            image: p.image || "",
            unit: "pcs",
          }),
        )
        setProducts(mappedProducts)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) {
          setFetched(true)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const inStock = useMemo(
    () => products.filter((p) => getStockStatus(p) === "in-stock").length,
    [products],
  )

  const lowStockCount = useMemo(
    () => products.filter((p) => getStockStatus(p) === "low-stock" || getStockStatus(p) === "out-of-stock").length,
    [products],
  )

  const lowStockItems = useMemo(
    () => products.filter((p) => getStockStatus(p) === "low-stock" || getStockStatus(p) === "out-of-stock").slice(0, 5),
    [products],
  )

  const recentChanges = useMemo(() => products.filter((p) => p.stock < 10).slice(0, 5), [products])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Products Managed"
          value={String(products.length)}
          trend={`${inStock} in stock`}
          trendType="up"
          icon={Package}
        />
        <KPICard
          title="Low Stock Warnings"
          value={String(dashboard?.kpis.lowStockCount ?? lowStockCount)}
          trend={(dashboard?.kpis.lowStockCount ?? lowStockCount) > 0 ? "Needs attention" : "All good"}
          trendType={(dashboard?.kpis.lowStockCount ?? lowStockCount) > 0 ? "warning" : "up"}
          icon={AlertTriangle}
        />
        <KPICard
          title="Pending Pickups"
          value={String(dashboard?.kpis.pendingPickups ?? 0)}
          trend={`${dashboard?.kpis.pendingPickups ?? 0} orders waiting`}
          trendType="warning"
          icon={ShoppingBag}
        />
        <KPICard
          title="Today's Verified Transactions"
          value={`₱${(dashboard?.kpis.todayRevenue ?? 0).toFixed(2)}`}
          trend="Today's revenue"
          trendType="up"
          icon={TrendingUp}
        />
      </div>

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
                    {p.barcode && <p className="text-[10px] font-mono text-muted-foreground">Barcode: {p.barcode}</p>}
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

    </div>
  )
}
