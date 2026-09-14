"use client"

import { X, Trash2 } from "lucide-react"

interface CancelReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: () => void
  reservation: {
    customerName: string
    totalAmount: number
  } | null
  loading: boolean
}

export function CancelReservationModal({
  isOpen,
  onClose,
  onCancel,
  reservation,
  loading,
}: CancelReservationModalProps) {
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
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
