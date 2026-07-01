"use client"

import { TrendingUp } from "lucide-react"
import type { HistoryMetricsData } from "@/types/admin"

interface HistoryMetricsProps {
  metrics: HistoryMetricsData | null
  loading: boolean
}

export function HistoryMetrics({ metrics, loading }: HistoryMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-6 h-[112px]" />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-primary">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Total Transactions
        </span>
        <div className="mt-4">
          <h4 className="text-2xl font-black text-foreground">{metrics.totalTransactionsDisplay}</h4>
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 mt-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {metrics.trend} this week
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-teal-500">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Total Sales (PHP)
        </span>
        <div className="mt-4">
          <h4 className="text-2xl font-black text-foreground">{metrics.totalSalesDisplay}</h4>
        </div>
      </div>
    </div>
  )
}
