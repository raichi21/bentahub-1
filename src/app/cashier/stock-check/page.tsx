"use client"

import { StockSummaryCards } from "@/features/cashier-dashboard/components/stock-summary-cards"
import { StockTable } from "@/features/cashier-dashboard/components/stock-table"
import { useCashierProducts } from "@/features/cashier-dashboard/hooks/use-cashier-products"

export default function StockCheckPage() {
  const { products, isLoading, error } = useCashierProducts()

  if (error) {
    return (
      <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-background">
      <StockSummaryCards products={products} />
      <StockTable products={products} isLoading={isLoading} />
    </div>
  )
}
