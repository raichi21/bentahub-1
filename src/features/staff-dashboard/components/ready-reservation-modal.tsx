"use client"

import { X, CheckCircle } from "lucide-react"

interface ReadyReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onReady: () => void
  reservation: {
    customerName: string
    totalAmount: number
    itemsCount: number
  } | null
  loading: boolean
}

export function ReadyReservationModal({ isOpen, onClose, onReady, reservation, loading }: ReadyReservationModalProps) {
  if (!isOpen || !reservation) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-sm font-bold text-foreground">Mark as Ready</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-blue-800">Mark this order as ready for pickup?</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-bold text-foreground">{reservation.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span className="font-bold text-foreground">{reservation.itemsCount}</span>
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
            Cancel
          </button>
          <button
            onClick={onReady}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
          >
            {loading ? "Marking..." : "Mark as Ready"}
          </button>
        </div>
      </div>
    </div>
  )
}
