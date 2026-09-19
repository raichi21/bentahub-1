"use client"

import { Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { KPICard } from "@/features/admin-dashboard"
import { StockTable } from "@/features/cashier-dashboard/components/stock-table"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"
import { getStockStatus } from "@/lib/staff-utils"

export default function StockCheckPage() {
  const { products, isLoading, error } = useCashierProducts()

  const inStockCount = products.filter(
    (p) => getStockStatus(p) === "in-stock"
  ).length
  const lowStockCount = products.filter(
    (p) => getStockStatus(p) === "low-stock"
  ).length
  const outOfStockCount = products.filter(
    (p) => getStockStatus(p) === "out-of-stock"
  ).length

  if (error) {
    return (
      <div className="flex flex-1 flex-col space-y-6 overflow-y-auto bg-background p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col space-y-6 overflow-y-auto bg-background p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-[400px] animate-pulse rounded-xl border border-border bg-card p-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col space-y-4 overflow-y-auto bg-background p-4 md:space-y-6 md:p-6">
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
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
