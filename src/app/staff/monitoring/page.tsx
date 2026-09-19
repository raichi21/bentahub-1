"use client"

import { useState, useEffect, useMemo } from "react"
import { LiveTransactionFeed } from "@/features/staff-dashboard/components/live-transaction-feed"
import { KPICard } from "@/features/admin-dashboard"
import { Receipt, TrendingUp, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { StaffApiResponse, StaffTransactionItem } from "@/types/staff"

export default function MonitoringPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<StaffTransactionItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    fetch("/api/staff/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(
        (res) => res.json() as Promise<StaffApiResponse<StaffTransactionItem[]>>
      )
      .then((json) => {
        if (cancelled) return
        if (json.success && json.data) {
          setTransactions(json.data)
        } else {
          setError(json.message)
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load transactions")
      })
      .finally(() => {
        if (!cancelled) setFetched(true)
      })

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const kpis = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed")
    const cancelled = transactions.filter((t) => t.status === "cancelled")
    const revenue = completed.reduce((sum, t) => sum + t.total, 0)
    return {
      totalTransactions: transactions.length,
      totalRevenue: revenue,
      totalCancelled: cancelled.length,
      completedCount: completed.length,
    }
  }, [transactions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 h-8 w-48 rounded bg-muted" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-2 h-12 rounded bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Today's Transactions"
          value={String(kpis.totalTransactions)}
          trend={`${kpis.completedCount} completed`}
          trendType="up"
          icon={Receipt}
        />
        <KPICard
          title="Total Revenue"
          value={`₱${kpis.totalRevenue.toFixed(2)}`}
          trend="Today's total"
          trendType="up"
          icon={TrendingUp}
        />
        <KPICard
          title="Cancelled Transactions"
          value={String(kpis.totalCancelled)}
          trend="Requires attention"
          trendType="down"
          icon={XCircle}
        />
      </div>

      <LiveTransactionFeed transactions={transactions} />
    </div>
  )
}
