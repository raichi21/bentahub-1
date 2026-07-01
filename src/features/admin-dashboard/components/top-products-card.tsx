"use client"

import { TrendingUp, Package } from "lucide-react"
import type { TopProductData } from "@/types/admin"

interface TopProductsCardProps {
  data?: TopProductData[]
}

export function TopProductsCard({ data }: TopProductsCardProps) {
  const isEmpty = !data || data.length === 0
  const maxSold = !isEmpty ? data[0].totalSold || 1 : 1

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Top Selling Products</h2>
          <p className="text-sm text-muted-foreground">Best performing items by quantity sold</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 h-[200px]">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No sales data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2 font-medium w-8">#</th>
                <th className="text-left pb-2 font-medium">Product</th>
                <th className="text-right pb-2 font-medium">Sold</th>
                <th className="text-right pb-2 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.productId} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-xs text-muted-foreground font-mono">{item.rank}</td>
                  <td className="py-2.5 text-sm font-medium text-foreground">{item.productName}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(item.totalSold / maxSold) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground min-w-[3ch] text-right">
                        {item.totalSold}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-xs font-mono text-muted-foreground">
                    ₱{item.totalRevenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
