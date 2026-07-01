"use client"

import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import type { PickupMetricsData } from "@/types/admin"

interface PickupMetricsProps {
  metrics: PickupMetricsData | null
  loading: boolean
}

export function PickupMetrics({ metrics, loading }: PickupMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card p-8 rounded-xl border border-border shadow-sm h-[140px]" />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card p-8 rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-between h-[140px]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Total Orders</p>
          <h3 className="text-[32px] font-bold text-foreground leading-none mt-2">{metrics.total}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> {metrics.totalTrend} vs last week
        </div>
      </div>

      <div className="bg-card p-8 rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-between h-[140px]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Completed</p>
          <h3 className="text-[32px] font-bold text-foreground leading-none mt-2">{metrics.completed}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {metrics.completedRate} success rate
        </div>
      </div>

      <div className="bg-card p-8 rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-between h-[140px]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Pending</p>
          <h3 className="text-[32px] font-bold text-foreground leading-none mt-2">{metrics.pending}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5" /> {metrics.urgentCount} urgent
        </div>
      </div>

      <div className="bg-card p-8 rounded-xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-between h-[140px]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Delayed</p>
          <h3 className="text-[32px] font-bold text-foreground leading-none mt-2">{metrics.delayed}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> Immediate attention
        </div>
      </div>
    </div>
  )
}
