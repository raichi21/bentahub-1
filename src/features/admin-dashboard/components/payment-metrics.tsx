"use client"

import type { PaymentMetricsData } from "@/types/admin"

interface PaymentMetricsProps {
  metrics: PaymentMetricsData | null
  loading: boolean
}

export function PaymentMetrics({ metrics, loading }: PaymentMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-6 h-[120px]" />
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-primary">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Payments</span>
        <div className="mt-4">
          <h4 className="text-2xl font-black text-foreground">{metrics.totalAmountDisplay}</h4>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">{metrics.completedCount} verified</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[10px] font-bold text-muted-foreground">{metrics.pendingCount} pending</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-teal-500">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cash</span>
        <div className="mt-4">
          <h4 className="text-2xl font-black text-foreground">{metrics.cashTotalDisplay}</h4>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.max(metrics.cashPercentage, 2)}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">GCash</span>
        <div className="mt-4">
          <h4 className="text-2xl font-black text-foreground">{metrics.gcashTotalDisplay}</h4>
          <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.max(metrics.gcashPercentage, 2)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
