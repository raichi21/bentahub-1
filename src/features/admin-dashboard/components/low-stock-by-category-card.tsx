"use client"

import { AlertTriangle, Package } from "lucide-react"
import type { LowStockByCategoryData } from "@/types/admin"

interface LowStockByCategoryCardProps {
  data?: LowStockByCategoryData[]
}

function getSeverity(pct: number): { bar: string; text: string } {
  if (pct > 30) return { bar: "bg-red-500", text: "text-red-500" }
  if (pct > 15) return { bar: "bg-yellow-500", text: "text-yellow-500" }
  return { bar: "bg-green-500", text: "text-green-500" }
}

export function LowStockByCategoryCard({ data }: LowStockByCategoryCardProps) {
  const isEmpty = !data || data.length === 0

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Low Stock by Category</h2>
          <p className="text-sm text-muted-foreground">Products below reorder threshold across all branches</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 h-[200px]">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No category data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-2 font-medium">Category</th>
                <th className="text-right pb-2 font-medium">Total Items</th>
                <th className="text-right pb-2 font-medium">Low Stock</th>
                <th className="text-right pb-2 font-medium w-40">% Low</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const severity = getSeverity(item.lowStockPercentage)
                return (
                  <tr key={item.category} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-sm font-medium text-foreground">{item.category}</td>
                    <td className="py-2.5 text-right text-xs font-mono text-muted-foreground">{item.totalItems}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs font-mono font-bold ${severity.text}`}>
                        {item.lowStockCount}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${severity.bar}`}
                            style={{ width: `${Math.min(item.lowStockPercentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono font-bold min-w-[3ch] text-right ${severity.text}`}>
                          {item.lowStockPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
