"use client"

import { useState } from "react"
import type {
  SalesTrendPointData,
  SalesTrendWeeklyData,
  SalesTrendDailyData,
} from "@/types/admin"

interface SalesChartProps {
  data?: SalesTrendPointData[] | null
  weeklyData?: SalesTrendWeeklyData[] | null
  dailyData?: SalesTrendDailyData[] | null
}

export function SalesChart({ data, weeklyData, dailyData }: SalesChartProps) {
  const [view, setView] = useState<"monthly" | "weekly" | "daily">("monthly")

  const months = data
    ? data.map((d) => d.month)
    : [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ]

  const weeks = weeklyData ?? []
  const days = dailyData ?? []

  const labels =
    view === "monthly"
      ? months
      : view === "weekly"
        ? weeks.map((w) => w.weekLabel)
        : days.map((d) => d.day)
  const values =
    view === "monthly"
      ? (data ?? []).map((d) => d.revenue)
      : view === "weekly"
        ? weeks.map((w) => w.revenue)
        : days.map((d) => d.revenue)

  const maxRevenue = values.length > 0 ? Math.max(...values, 1) : 150000

  const isDaily = view === "daily"

  return (
    <div className="flex min-h-[400px] flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sales Trend</h2>
          <p className="text-sm text-muted-foreground">
            {view === "monthly"
              ? "Monthly"
              : view === "weekly"
                ? "Weekly"
                : "Daily"}{" "}
            sales performance for current month
          </p>
        </div>
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <button
            onClick={() => setView("monthly")}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3 sm:text-sm ${view === "monthly" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3 sm:text-sm ${view === "weekly" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView("daily")}
            className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3 sm:text-sm ${view === "daily" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            Daily
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col" style={{ minHeight: 0 }}>
        {/* Bars area */}
        <div
          className={`flex items-end gap-1 overflow-x-auto px-1 pt-10 pb-1 sm:gap-2 sm:px-4`}
          style={{ minHeight: 0 }}
        >
          {labels.map((label, index) => {
            const value = values[index] ?? 0
            const ratio = maxRevenue > 0 ? value / maxRevenue : 0
            const barHeight = Math.max(
              ratio * (isDaily ? 200 : 240),
              ratio > 0 ? 2 : 0
            )

            return (
              <div
                key={label}
                className={`group relative z-10 flex h-full flex-1 flex-col items-center justify-end ${isDaily ? "min-w-[24px] sm:min-w-[32px]" : "min-w-[36px]"}`}
              >
                <div
                  className={`relative w-full flex-shrink-0 cursor-pointer rounded-t-sm bg-primary/20 transition-all hover:bg-primary ${isDaily ? "max-w-[24px]" : "max-w-[48px]"}`}
                  style={{ height: `${barHeight}px` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {value.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                      notation: "compact",
                    })}
                  </div>
                </div>
                <span className="w-full truncate pt-1 text-center text-[10px] text-muted-foreground sm:text-xs">
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
