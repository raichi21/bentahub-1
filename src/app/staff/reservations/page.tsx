"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"

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
  items: Array<{ productName: string; quantity: number; price: number; subtotal: number }>
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
  const [denyId, setDenyId] = useState<string | null>(null)
  const [denyReason, setDenyReason] = useState("")

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
    fetchReservations()
  }, [token, authLoading, fetchReservations])

  const handleAction = async (orderId: string, action: "confirm" | "deny" | "ready", reason?: string) => {
    if (!token) return
    setActionLoading(orderId)
    try {
      const res = await fetch("/api/staff/reservations", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ orderId, action, reason }),
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.message || "Failed to update reservation")
        return
      }
      setDenyId(null)
      setDenyReason("")
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
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (authLoading || (!fetched && token)) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Reservations</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage customer reservations for your branch</p>
      </div>

      <div className="flex gap-1 bg-surface-container rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${tab === "pending" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("processing")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${tab === "processing" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          Processing ({processing.length + ready.length})
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {displayList.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {tab === "pending" ? "No pending reservations" : "No reservations being processed"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayList.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{r.customerName}</span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      r.status === "pending" ? "bg-amber-100 text-amber-700" :
                      r.status === "processing" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {r.status === "ready" ? "Ready for Pickup" : r.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.customerEmail}{r.customerPhone ? ` · ${r.customerPhone}` : ""}</p>
                </div>
                <span className="text-lg font-extrabold text-foreground">₱{r.totalAmount.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(r.createdAt)}
                </span>
                {r.pickupDeadline && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pickup by: {formatDate(r.pickupDeadline)}
                  </span>
                )}
                <span className="capitalize">{r.paymentMethod}</span>
              </div>

              <div className="border-t border-border pt-3 mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Items</p>
                <div className="space-y-1">
                  {r.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-foreground">{item.productName} x{item.quantity}</span>
                      <span className="text-muted-foreground">₱{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  {r.items.length > 4 && (
                    <p className="text-xs text-muted-foreground">...and {r.items.length - 4} more items</p>
                  )}
                </div>
              </div>

              {r.notes && (
                <div className="mb-3 text-xs text-muted-foreground bg-surface-container p-2 rounded-lg">
                  <span className="font-bold">Notes: </span>{r.notes}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(r.id, "confirm")}
                      disabled={actionLoading === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === r.id ? "..." : <><CheckCircle className="w-3.5 h-3.5" /> Confirm</>}
                    </button>
                    {denyId === r.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          value={denyReason}
                          onChange={(e) => setDenyReason(e.target.value)}
                          placeholder="Reason (optional)"
                          className="flex-1 px-2 py-1.5 text-xs border border-border rounded-lg bg-background"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAction(r.id, "deny", denyReason)}
                          disabled={actionLoading === r.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === r.id ? "..." : "Deny"}
                        </button>
                        <button
                          onClick={() => { setDenyId(null); setDenyReason("") }}
                          className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDenyId(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Deny
                      </button>
                    )}
                  </>
                )}
                {r.status === "processing" && (
                  <button
                    onClick={() => handleAction(r.id, "ready")}
                    disabled={actionLoading === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === r.id ? "..." : <><CheckCircle className="w-3.5 h-3.5" /> Mark as Ready</>}
                  </button>
                )}
                {r.status === "ready" && (
                  <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for Pickup
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
