"use client"

import { CalendarCheck, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import type { ReservationMetricsData } from "@/types/admin"

interface ReservationMetricsProps {
  metrics: ReservationMetricsData | null
  loading: boolean
}

export function ReservationMetrics({ metrics, loading }: ReservationMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-6 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between group hover:border-primary transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <span className="flex items-center text-primary font-bold text-[11px] bg-primary/10 px-3 py-1 rounded-full">
            {metrics?.totalTrend || "0%"}
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
            Total Reservations
          </p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {(metrics?.total ?? 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <span className="flex items-center text-amber-600 dark:text-amber-400 font-bold text-[11px] bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
            Active
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
            Pending
          </p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {metrics?.pending ?? 0}
          </h3>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between group hover:border-emerald-500 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
            {metrics && metrics.total > 0 ? `${Math.round((metrics.completed / metrics.total) * 100)}% Success` : "0%"}
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
            Completed
          </p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {metrics?.completed ?? 0}
          </h3>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between group hover:border-destructive transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
            <XCircle className="h-6 w-6" />
          </div>
          <span className="flex items-center text-destructive font-bold text-[11px] bg-destructive/10 px-3 py-1 rounded-full">
            {metrics && metrics.total > 0 ? `${Math.round((metrics.cancelled / metrics.total) * 100)}%` : "0%"}
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">
            Cancelled
          </p>
          <h3 className="text-3xl font-bold text-foreground tracking-tight">
            {metrics?.cancelled ?? 0}
          </h3>
        </div>
      </div>
    </div>
  )
}
