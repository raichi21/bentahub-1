"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { CashDrawerSession } from "@/types/cashier"

interface UseCashDrawerResult {
  session: CashDrawerSession | null
  isLoading: boolean
  canAcceptCash: boolean
  openShift: (startingCash: number, notes?: string) => Promise<void>
  closeShift: (actualEndingCash: number, notes?: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCashDrawer(): UseCashDrawerResult {
  const { token, isLoading: authLoading } = useAuth()
  const [session, setSession] = useState<CashDrawerSession | null>(null)
  const [fetched, setFetched] = useState(false)

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/cashier/shift", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) return
      const json = await res.json()
      setSession(json.data?.session ?? null)
    } catch {
      // non-fatal: leave session as-is
    } finally {
      setFetched(true)
    }
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) return refresh()
    })
    return () => {
      cancelled = true
    }
  }, [token, authLoading, refresh])

  const openShift = useCallback(
    async (startingCash: number, notes?: string) => {
      if (!token) return
      const res = await fetch("/api/cashier/shift", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startingCash, notes: notes || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to open cash drawer session")
      }
      setSession(json.data?.session ?? null)
      setFetched(true)
    },
    [token]
  )

  const closeShift = useCallback(
    async (actualEndingCash: number, notes?: string) => {
      if (!token || !session) return
      const res = await fetch(`/api/cashier/shift/${session.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actualEndingCash, notes: notes || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to close cash drawer session")
      }
      setSession(json.data?.session ?? null)
      setFetched(true)
    },
    [token, session]
  )

  const isLoading = authLoading || (token !== null && !fetched)

  return {
    session,
    isLoading,
    canAcceptCash: !!session && session.status === "open",
    openShift,
    closeShift,
    refresh,
  }
}
