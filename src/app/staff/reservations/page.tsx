"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Calendar, Clock, AlertCircle, CheckCircle, Trash2 } from "lucide-react"
import { ConfirmReservationModal } from "@/features/staff-dashboard/components/confirm-reservation-modal"
import { CancelReservationModal } from "@/features/staff-dashboard/components/cancel-reservation-modal"
import { ReadyReservationModal } from "@/features/staff-dashboard/components/ready-reservation-modal"

interface ReservationItem {
  id: string
  status: "pending" | "processing" | "ready"
  paymentMethod: string
  totalAmount: number
  notes: string | null
  isPaid: boolean
  pickupDeadline: string | null
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: Array<{
    productName: string
    quantity: number
    price: number
    subtotal: number
  }>
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export default function ReservationsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [tab, setTab] = useState<"pending" | "processing">("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [confirmModal, setConfirmModal] = useState<ReservationItem | null>(null)
  const [cancelModal, setCancelModal] = useState<ReservationItem | null>(null)
  const [cancelOverdueModal, setCancelOverdueModal] =
    useState<ReservationItem | null>(null)
  const [readyModal, setReadyModal] = useState<ReservationItem | null>(null)

  const fetchReservations = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/staff/reservations", {
        headers: authHeaders(token),
      })
      if (!res.ok) throw new Error("Failed to load reservations")
      const json = await res.json()
      if (json.success) {
        setReservations(json.data.reservations)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFetched(true)
    }
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    const timer = setTimeout(() => fetchReservations(), 0)
    return () => clearTimeout(timer)
  }, [token, authLoading, fetchReservations])

  const handleConfirm = async (orderId: string) => {
    if (!token) return
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/staff/reservations", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ orderId, action: "confirm" }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.message || "Failed to confirm reservation")
        return
      }
      setConfirmModal(null)
      fetchReservations()
    } catch {
      alert("An error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (orderId: string) => {
    if (!token) return
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/staff/reservations", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ orderId, action: "cancel" }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.message || "Failed to cancel reservation")
        return
      }
      setCancelModal(null)
      setCancelOverdueModal(null)
      fetchReservations()
    } catch {
      alert("An error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReady = async (orderId: string) => {
    if (!token) return
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/staff/reservations", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ orderId, action: "ready" }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.message || "Failed to mark as ready")
        return
      }
      setReadyModal(null)
      fetchReservations()
    } catch {
      alert("An error occurred")
    } finally {
      setActionLoading(null)
    }
  }

  const pending = reservations.filter((r) => r.status === "pending")
  const processing = reservations.filter((r) => r.status === "processing")
  const ready = reservations.filter((r) => r.status === "ready")

  const displayList = tab === "pending" ? pending : [...processing, ...ready]

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function isOverdue(deadline: string | null): boolean {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  if (authLoading || (!fetched && token)) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border bg-card p-5"
          >
            <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmReservationModal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => confirmModal && handleConfirm(confirmModal.id)}
        reservation={
          confirmModal
            ? {
                customerName: confirmModal.customerName,
                totalAmount: confirmModal.totalAmount,
                itemsCount: confirmModal.items.length,
              }
            : null
        }
        loading={actionLoading === confirmModal?.id}
      />

      <CancelReservationModal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        onCancel={() => cancelModal && handleCancel(cancelModal.id)}
        reservation={
          cancelModal
            ? {
                customerName: cancelModal.customerName,
                totalAmount: cancelModal.totalAmount,
              }
            : null
        }
        loading={actionLoading === cancelModal?.id}
      />

      <CancelReservationModal
        isOpen={!!cancelOverdueModal}
        onClose={() => setCancelOverdueModal(null)}
        onCancel={() =>
          cancelOverdueModal && handleCancel(cancelOverdueModal.id)
        }
        reservation={
          cancelOverdueModal
            ? {
                customerName: cancelOverdueModal.customerName,
                totalAmount: cancelOverdueModal.totalAmount,
              }
            : null
        }
        loading={actionLoading === cancelOverdueModal?.id}
      />

      <ReadyReservationModal
        isOpen={!!readyModal}
        onClose={() => setReadyModal(null)}
        onReady={() => readyModal && handleReady(readyModal.id)}
        reservation={
          readyModal
            ? {
                customerName: readyModal.customerName,
                totalAmount: readyModal.totalAmount,
                itemsCount: readyModal.items.length,
              }
            : null
        }
        loading={actionLoading === readyModal?.id}
      />

      <div className="bg-surface-container flex w-fit gap-1 rounded-lg p-1">
        <button
          onClick={() => setTab("pending")}
          className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${tab === "pending" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("processing")}
          className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${tab === "processing" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Processing ({processing.length + ready.length})
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tab === "pending"
              ? "No pending reservations"
              : "No reservations being processed"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayList.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">
                      {r.customerName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        r.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : r.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.status === "ready" ? "Ready for Pickup" : r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.customerEmail}
                    {r.customerPhone ? ` · ${r.customerPhone}` : ""}
                  </p>
                </div>
                <span className="text-lg font-extrabold text-foreground">
                  ₱{r.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(r.createdAt)}
                </span>
                {r.pickupDeadline && (
                  <span
                    className={`flex items-center gap-1 ${isOverdue(r.pickupDeadline) ? "font-bold text-red-600" : ""}`}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Pickup by: {formatDate(r.pickupDeadline)}
                    {isOverdue(r.pickupDeadline) && (
                      <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 uppercase">
                        Overdue
                      </span>
                    )}
                  </span>
                )}
                <span className="capitalize">{r.paymentMethod}</span>
              </div>

              <div className="mb-3 border-t border-border pt-3">
                <p className="mb-2 text-xs font-bold text-muted-foreground uppercase">
                  Items
                </p>
                <div className="space-y-1">
                  {r.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-foreground">
                        {item.productName} x{item.quantity}
                      </span>
                      <span className="text-muted-foreground">
                        ₱{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {r.items.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      ...and {r.items.length - 4} more items
                    </p>
                  )}
                </div>
              </div>

              {r.notes && (
                <div className="bg-surface-container mb-3 rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="font-bold">Notes: </span>
                  {r.notes}
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-border pt-2">
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => setConfirmModal(r)}
                      disabled={actionLoading === r.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === r.id ? (
                        "..."
                      ) : (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" /> Confirm
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setCancelModal(r)}
                      disabled={actionLoading === r.id}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </>
                )}
                {r.status === "processing" && (
                  <button
                    onClick={() => setReadyModal(r)}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === r.id ? (
                      "..."
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Mark as Ready
                      </>
                    )}
                  </button>
                )}
                {r.status === "ready" && (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" /> Ready for Pickup
                  </span>
                )}
                {isOverdue(r.pickupDeadline) && (
                  <button
                    onClick={() => setCancelOverdueModal(r)}
                    disabled={actionLoading === r.id}
                    className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    title="Cancel overdue reservation"
                  >
                    {actionLoading === r.id ? (
                      "..."
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
