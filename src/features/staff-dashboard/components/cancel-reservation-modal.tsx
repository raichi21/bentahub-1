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

export function CancelReservationModal({ isOpen, onClose, onCancel, reservation, loading }: CancelReservationModalProps) {
  if (!isOpen || !reservation) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-sm font-bold text-foreground">Cancel Reservation</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-800">Cancel this reservation?</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-bold text-foreground">{reservation.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">₱{reservation.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-border text-foreground rounded-lg text-xs font-bold hover:bg-muted transition-colors disabled:opacity-40"
          >
            Keep
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
          >
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
