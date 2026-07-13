import { Package, CheckCircle, AlertTriangle } from "lucide-react"
import { getStockStatus } from "@/lib/staff-utils"
import type { Product } from "@/types/cashier"

export function StockSummaryCards({ products }: { products: Product[] }) {
  const totalSKUs = products.length
  
  const inStockCount = products.filter(
    (p) => getStockStatus(p) === "in-stock"
  ).length

  const lowStockCount = products.filter(
    (p) => getStockStatus(p) === "low-stock"
  ).length

  const outOfStockCount = products.filter(
    (p) => getStockStatus(p) === "out-of-stock"
  ).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total SKUs */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between group hover:border-blue-600 transition-all duration-200">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total SKUs
          </p>
          <p className="text-2xl font-bold text-card-foreground">{totalSKUs}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-sm">
          <Package className="w-6 h-6" />
        </div>
      </div>

      {/* In Stock */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between group hover:border-blue-600 transition-all duration-200">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            In Stock
          </p>
          <p className="text-2xl font-bold text-card-foreground">{inStockCount}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-sm">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Low & Out of Stock Alerts */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center justify-between group hover:border-red-500 transition-all duration-200">
        <div>
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">
            Low / Out Stock
          </p>
          <p className="text-2xl font-bold text-card-foreground">
            {lowStockCount} <span className="text-xs font-normal text-muted-foreground">low</span> /{" "}
            {outOfStockCount} <span className="text-xs font-normal text-muted-foreground">out</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-200 shadow-sm">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
