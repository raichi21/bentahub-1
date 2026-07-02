"use client"

import { useState, useEffect, useMemo } from "react"
import { StaffTransactionTable } from "@/features/staff-dashboard/components/staff-transaction-table"
import { useAuth } from "@/hooks/useAuth"
import type { Transaction } from "@/types/cashier"

export default function HistoryPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchHistory() {
      try {
        const res = await fetch("/api/staff/history", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load history")

        const json = await res.json()

        if (cancelled) return
        setTransactions(json.data || [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) setFetched(true)
      }
    }

    fetchHistory()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const cashCount = useMemo(() => transactions.filter((t) => t.paymentMethod === "cash").length, [transactions])
  const gcashCount = useMemo(() => transactions.filter((t) => t.paymentMethod === "gcash").length, [transactions])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-4" />
              <div className="h-7 bg-muted rounded w-12 mb-2" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 animate-pulse">
          <div className="h-8 bg-muted rounded w-full mb-4" />
          <div className="h-64 bg-muted rounded w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-bold text-foreground mb-1">Failed to load history</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">Total Records</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">{transactions.length}</h3>
          <span className="text-xs text-muted-foreground font-medium">All time</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">Cash Payments</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">{cashCount}</h3>
          <span className="text-xs text-muted-foreground font-medium">Transactions</span>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-muted-foreground">GCash Payments</span>
          <h3 className="text-2xl font-extrabold text-foreground mt-1">{gcashCount}</h3>
          <span className="text-xs text-muted-foreground font-medium">Transactions</span>
        </div>
      </div>

      <StaffTransactionTable transactions={transactions} />
    </div>
  )
}
