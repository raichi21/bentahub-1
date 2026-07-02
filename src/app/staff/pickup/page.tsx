"use client"

import { useState, useEffect, useCallback } from "react"
import { PaymentPickupList } from "@/features/staff-dashboard/components/payment-pickup-list"
import { useAuth } from "@/hooks/useAuth"

export default function PickupPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [pickups, setPickups] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchData() {
      try {
        const res = await fetch("/api/staff/pickups", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load pickups")

        const json = await res.json()

        if (cancelled) return
        setPayments(json.data?.payments || [])
        setPickups(json.data?.pickups || [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) setFetched(true)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const handleVerifyPayment = useCallback(async (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "verified" } : p))
    )

    try {
      const res = await fetch("/api/staff/pickups", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: paymentId, action: "verify" }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message)

      const txn = payments.find((p) => p.id === paymentId)
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
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
