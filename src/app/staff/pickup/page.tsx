"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PaymentPickupList } from "@/features/staff-dashboard/components/payment-pickup-list"
import { useAuth } from "@/hooks/useAuth"
import type { PaymentItem, PickupItem } from "@/features/staff-dashboard/components/payment-pickup-list"

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export default function PickupPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [pickups, setPickups] = useState<PickupItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const isFetchingRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!token || isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setError(null)

      const res = await fetch("/api/staff/pickups", {
        headers: authHeaders(token),
      })

      if (!res.ok) throw new Error("Failed to load pickups")

      const json = await res.json()
      setPayments(json.data?.payments || [])
      setPickups(json.data?.pickups || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      isFetchingRef.current = false
      setFetched(true)
    }
  }, [token])

  useEffect(() => {
    if (authLoading || !token) {
      if (!token) setFetched(true)
      return
    }

    fetchData()

    const interval = setInterval(() => fetchData(), 30000)
    return () => clearInterval(interval)
  }, [token, authLoading, fetchData])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const handleVerifyPayment = useCallback(async (paymentId: string) => {
    const prevPayments = payments

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "verified" } : p))
    )

    try {
      const res = await fetch("/api/staff/pickups", {
        method: "PATCH",
        headers: authHeaders(token!),
        body: JSON.stringify({ orderId: paymentId, action: "verify" }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      const txn = prevPayments.find((p) => p.id === paymentId)
      if (txn) {
        setPickups((prev) => [
          ...prev,
          {
            id: txn.id,
            transactionId: txn.id,
            customerName: txn.customerName || "Unknown",
            code: `PK-${txn.id.slice(0, 8).toUpperCase()}`,
            date: new Date().toISOString(),
            status: "ready",
          },
        ])
      }
    } catch (err) {
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "pending" } : p))
      )
      alert(err instanceof Error ? err.message : "Verification failed")
    }
  }, [token, payments])

  const handleCompletePickup = useCallback(async (pickupId: string) => {
    setPickups((prev) =>
      prev.map((p) => (p.id === pickupId ? { ...p, status: "completed" } : p))
    )

    try {
      const res = await fetch("/api/staff/pickups", {
        method: "PATCH",
        headers: authHeaders(token!),
        body: JSON.stringify({ orderId: pickupId, action: "complete" }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
    } catch (err) {
      setPickups((prev) =>
        prev.map((p) => (p.id === pickupId ? { ...p, status: "ready" } : p))
      )
      alert(err instanceof Error ? err.message : "Completion failed")
    }
  }, [token])

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        <p className="text-sm font-bold text-foreground mb-1">Failed to load pickups</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PaymentPickupList
        payments={payments}
        pickups={pickups}
        onVerifyPayment={handleVerifyPayment}
        onCompletePickup={handleCompletePickup}
      />
    </div>
  )
}
