"use client"

import { TrendingUp, Package } from "lucide-react"
import type { TopProductData } from "@/types/admin"

interface TopProductsCardProps {
  data?: TopProductData[]
}

const BAR_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-violet-500",
  "bg-cyan-500", "bg-teal-500", "bg-emerald-500",
  "bg-amber-500", "bg-orange-500", "bg-rose-500", "bg-pink-500",
]

export function TopProductsCard({ data }: TopProductsCardProps) {
  const isEmpty = !data || data.length === 0
  const maxSold = !isEmpty ? data[0].totalSold || 1 : 1

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5 min-h-[400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Top Selling Products</h2>
          <p className="text-sm text-muted-foreground">Best performing items by quantity sold</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 flex-1">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No sales data available</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {data.map((item, i) => (
            <div key={item.productId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{item.rank}</span>
                  <span className="font-medium text-foreground truncate">{item.productName}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-foreground">{item.totalSold}</span>
                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">₱{item.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${(item.totalSold / maxSold) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
