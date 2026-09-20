"use client"

import { useState } from "react"
import { X, Trash2 } from "lucide-react"

interface CancelReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: (reason: string) => void
  reservation: {
    customerName: string
    totalAmount: number
  } | null
  loading: boolean
  requireReason?: boolean
}

export function CancelReservationModal({
  isOpen,
  onClose,
  onCancel,
  reservation,
  loading,
  requireReason = false,
}: CancelReservationModalProps) {
  const [reason, setReason] = useState("")
  const canSubmit = !requireReason || reason.trim().length > 0

  if (!isOpen || !reservation) return null

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto w-full max-w-sm animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">
            Cancel Reservation
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <Trash2 className="mx-auto mb-2 h-8 w-8 text-red-600" />
            <p className="text-sm font-bold text-red-800">
              Cancel this reservation?
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-bold text-foreground">
                {reservation.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">
                ₱{reservation.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {requireReason && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Reason for cancellation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="e.g., Item out of stock"
                className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            Keep
          </button>
          <button
            onClick={() => onCancel(reason)}
            disabled={loading || !canSubmit}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
