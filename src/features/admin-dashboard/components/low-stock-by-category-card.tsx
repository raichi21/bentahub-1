"use client"

import Link from "next/link"
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
  const maxPct = !isEmpty
    ? Math.max(...data.map((d) => d.lowStockPercentage), 1)
    : 1

  return (
    <div className="flex min-h-[400px] flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Low Stock by Category
          </h2>
          <p className="text-sm text-muted-foreground">
            Products below reorder threshold across all branches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/monitoring"
            className="text-[11px] font-semibold tracking-wide text-primary hover:underline"
          >
            View Details
          </Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Package className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            No category data available
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {data.map((item) => {
            const severity = getSeverity(item.lowStockPercentage)
            return (
              <div key={item.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-medium text-foreground">
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.totalItems} items)
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`font-mono text-xs font-bold ${severity.text}`}
                    >
                      {item.lowStockCount}
                    </span>
                    <span
                      className={`min-w-[3ch] text-right font-mono text-xs font-bold ${severity.text}`}
                    >
                      {item.lowStockPercentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${severity.bar}`}
                    style={{
                      width: `${Math.min((item.lowStockPercentage / maxPct) * 100, 100)}%`,
                    }}
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
