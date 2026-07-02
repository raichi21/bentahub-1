"use client"

import { useState, useEffect, useMemo } from "react"
import { LiveTransactionFeed } from "@/features/staff-dashboard/components/live-transaction-feed"
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
      .then((res) => res.json() as Promise<StaffApiResponse<StaffTransactionItem[]>>)
      .then((json) => {
        if (cancelled) return
        if (json.success && json.data) {
          setTransactions(json.data)
        } else {
          setError(json.message)
        }
      })
      .catch(() => { if (!cancelled) setError("Failed to load transactions") })
      .finally(() => { if (!cancelled) setFetched(true) })

    return () => { cancelled = true }
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-5 animate-pulse">
              <div className="h-3 w-24 bg-muted rounded mb-3" />
              <div className="h-7 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted/50 rounded mb-2" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">Today&apos;s Transactions</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">{kpis.totalTransactions}</h3>
          <span className="text-xs text-green-500 font-medium">{kpis.completedCount} completed</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">₱{kpis.totalRevenue.toFixed(2)}</h3>
          <span className="text-xs text-green-500 font-medium">Today&apos;s total</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">Cancelled Transactions</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">{kpis.totalCancelled}</h3>
          <span className="text-xs text-red-500 font-medium">Requires attention</span>
        </div>
      </div>

      <LiveTransactionFeed transactions={transactions} />
    </div>
  )
}
