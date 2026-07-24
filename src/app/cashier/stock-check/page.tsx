"use client"

import { Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { KPICard } from "@/features/admin-dashboard"
import { StockTable } from "@/features/cashier-dashboard/components/stock-table"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"
import { getStockStatus } from "@/lib/staff-utils"

export default function StockCheckPage() {
  const { products, isLoading, error } = useCashierProducts()

  const inStockCount = products.filter((p) => getStockStatus(p) === "in-stock").length
  const lowStockCount = products.filter((p) => getStockStatus(p) === "low-stock").length
  const outOfStockCount = products.filter((p) => getStockStatus(p) === "out-of-stock").length

  if (error) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {error}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-4" />
              <div className="h-8 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total SKUs"
          value={String(products.length)}
          trend="All SKUs"
          trendType="up"
          icon={Package}
        />
        <KPICard
          title="In Stock"
          value={String(inStockCount)}
          trend="Healthy stock levels"
          trendType="up"
          icon={CheckCircle}
        />
        <KPICard
          title="Low Stock"
          value={String(lowStockCount)}
          trend="Needs restocking"
          trendType="warning"
          icon={AlertTriangle}
        />
        <KPICard
          title="Out of Stock"
          value={String(outOfStockCount)}
          trend="Critical"
          trendType="down"
          icon={XCircle}
        />
      </div>
      <StockTable products={products} isLoading={isLoading} />
    </div>
  )
}
