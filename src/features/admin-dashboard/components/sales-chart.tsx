"use client"

import { useState } from "react"
import type { SalesTrendPointData, SalesTrendWeeklyData, SalesTrendDailyData } from "@/types/admin"

interface SalesChartProps {
  data?: SalesTrendPointData[] | null
  weeklyData?: SalesTrendWeeklyData[] | null
  dailyData?: SalesTrendDailyData[] | null
}

export function SalesChart({ data, weeklyData, dailyData }: SalesChartProps) {
  const [view, setView] = useState<"monthly" | "weekly" | "daily">("monthly")

  const months = data
    ? data.map((d) => d.month)
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const weeks = weeklyData ?? []
  const days = dailyData ?? []

  const labels =
    view === "monthly" ? months : view === "weekly" ? weeks.map((w) => w.weekLabel) : days.map((d) => d.day)
  const values =
    view === "monthly"
      ? (data ?? []).map((d) => d.revenue)
      : view === "weekly"
      ? weeks.map((w) => w.revenue)
      : days.map((d) => d.revenue)

  const maxRevenue = values.length > 0 ? Math.max(...values, 1) : 150000

  const isDaily = view === "daily"

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 h-[400px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sales Trend</h2>
          <p className="text-sm text-muted-foreground">
            {view === "monthly" ? "Monthly" : view === "weekly" ? "Weekly" : "Daily"} sales performance for current month
          </p>
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
          <button
            onClick={() => setView("daily")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === "daily" ? "text-foreground bg-accent" : "text-muted-foreground hover:bg-accent"}`}
          >
            Daily
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative" style={{ minHeight: 0 }}>
        {/* Bars area */}
        <div
          className={`flex items-end justify-between gap-2 px-4 ${isDaily ? "overflow-x-auto pt-10 pb-1" : ""}`}
          style={{ minHeight: 0 }}
        >
          {labels.map((label, index) => {
            const value = values[index] ?? 0
            const ratio = maxRevenue > 0 ? value / maxRevenue : 0
            const barHeight = Math.max(ratio * (isDaily ? 200 : 240), ratio > 0 ? 2 : 0)

            return (
              <div
                key={label}
                className={`relative flex flex-col items-center h-full justify-end group z-10 ${isDaily ? "min-w-[32px] flex-1" : "flex-1"}`}
              >
                <div
                  className={`w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all cursor-pointer relative flex-shrink-0 ${isDaily ? "max-w-[24px]" : "max-w-[48px]"}`}
                  style={{ height: `${barHeight}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                    {value.toLocaleString("en-PH", { style: "currency", currency: "PHP", notation: "compact" })}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground pt-1 whitespace-nowrap">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
