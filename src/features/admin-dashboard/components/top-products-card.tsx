"use client"

import Link from "next/link"
import { TrendingUp, Package } from "lucide-react"
import type { TopProductData } from "@/types/admin"

interface TopProductsCardProps {
  data?: TopProductData[]
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-pink-500",
]

export function TopProductsCard({ data }: TopProductsCardProps) {
  const isEmpty = !data || data.length === 0
  const maxSold = !isEmpty ? data[0].totalSold || 1 : 1

  return (
    <div className="flex min-h-[400px] flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Top Selling Products
          </h2>
          <p className="text-sm text-muted-foreground">
            Best performing items by quantity sold
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sales"
            className="text-[11px] font-semibold tracking-wide text-primary hover:underline"
          >
            View Details
          </Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Package className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            No sales data available
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          {data.map((item, i) => (
            <div key={item.productId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
                    {item.rank}
                  </span>
                  <span className="truncate font-medium text-foreground">
                    {item.productName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {item.totalSold}
                  </span>
                  <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                    ₱{item.totalRevenue.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
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
