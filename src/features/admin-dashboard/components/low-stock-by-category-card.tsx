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
  const maxPct = !isEmpty ? Math.max(...data.map((d) => d.lowStockPercentage), 1) : 1

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5 min-h-[400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Low Stock by Category</h2>
          <p className="text-sm text-muted-foreground">Products below reorder threshold across all branches</p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 flex-1">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No category data available</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {data.map((item) => {
            const severity = getSeverity(item.lowStockPercentage)
            return (
              <div key={item.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-foreground">{item.category}</span>
                    <span className="text-xs text-muted-foreground">({item.totalItems} items)</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono font-bold ${severity.text}`}>{item.lowStockCount}</span>
                    <span className={`text-xs font-mono font-bold min-w-[3ch] text-right ${severity.text}`}>
                      {item.lowStockPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${severity.bar}`}
                    style={{ width: `${Math.min((item.lowStockPercentage / maxPct) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
