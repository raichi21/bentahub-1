"use client"

import { useState } from "react"
import type { SalesTrendPointData } from "@/types/admin"

interface SalesChartProps {
  data?: SalesTrendPointData[] | null
}

export function SalesChart({ data }: SalesChartProps) {
  const [view, setView] = useState<"monthly" | "weekly">("monthly")

  const months = data
    ? data.map((d) => d.month)
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const weeks = data
    ? data.flatMap((d) => {
        const weeksInMonth = Math.floor(d.revenue / 5000) + 1
        return Array.from({ length: Math.min(weeksInMonth, 4) }, (_, i) => ({
          label: `${d.month} W${i + 1}`,
          revenue: Math.round(d.revenue / weeksInMonth),
        }))
      })
    : []

  const labels = view === "monthly" ? months : weeks.map((w) => w.label)
  const values = view === "monthly" ? (data ?? []).map((d) => d.revenue) : weeks.map((w) => w.revenue)

  const maxRevenue = values.length > 0 ? Math.max(...values, 1) : 150000

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 h-[400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sales Trend</h2>
          <p className="text-sm text-muted-foreground">{view === "monthly" ? "Monthly" : "Weekly"} sales performance across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("monthly")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === "monthly" ? "text-foreground bg-accent" : "text-muted-foreground hover:bg-accent"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === "weekly" ? "text-foreground bg-accent" : "text-muted-foreground hover:bg-accent"}`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-4 relative">
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-muted-foreground/50 pointer-events-none">
          <div className="border-b border-border w-full pb-1">{(maxRevenue * 0.75).toLocaleString("en-PH", { style: "currency", currency: "PHP", notation: "compact" })}</div>
          <div className="border-b border-border w-full pb-1">{(maxRevenue * 0.5).toLocaleString("en-PH", { style: "currency", currency: "PHP", notation: "compact" })}</div>
          <div className="border-b border-border w-full pb-1">{(maxRevenue * 0.25).toLocaleString("en-PH", { style: "currency", currency: "PHP", notation: "compact" })}</div>
          <div className="w-full">₱0</div>
        </div>

        {labels.map((label, index) => {
          const value = values[index] ?? 0
          const height = maxRevenue > 0 ? Math.max((value / maxRevenue) * 95, 2) : 2

          return (
            <div key={label} className="relative flex-1 flex flex-col items-center gap-2 group z-10">
              <div
                className="w-full max-w-[48px] bg-primary/20 hover:bg-primary rounded-t-sm transition-all cursor-pointer relative"
                style={{ height: `${height}%` }}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                  {value.toLocaleString("en-PH", { style: "currency", currency: "PHP", notation: "compact" })}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
