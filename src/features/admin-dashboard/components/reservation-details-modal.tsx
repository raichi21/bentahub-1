"use client"

import { X } from "lucide-react"
import type { ReservationRowData } from "@/types/admin"

interface ReservationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: ReservationRowData | null
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  ready: "bg-primary/10 text-primary border border-primary/20",
  completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
}

export function ReservationDetailsModal({ isOpen, onClose, order }: ReservationDetailsModalProps) {
  if (!isOpen || !order) return null

  const total = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  const statusDot = order.status === "ready" ? "bg-primary animate-pulse" : order.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Reservation Details - {order.displayId}</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-xs border ${STATUS_STYLES[order.status] || ""}`}>
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Reservation ID: <span className="font-semibold text-foreground">{order.displayId}</span></p>
                <p className="text-muted-foreground">Branch: <span className="font-semibold text-foreground">{order.branch}</span></p>
                {order.pickupDeadline && (
                  <p className="text-muted-foreground">Pickup Deadline: <span className="font-semibold text-foreground">
                    {new Date(order.pickupDeadline).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span></p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Name: <span className="font-semibold text-foreground">{order.customerName}</span></p>
                <p className="text-muted-foreground">Email: <span className="font-semibold text-foreground">{order.customerEmail}</span></p>
                {order.customerPhone && <p className="text-muted-foreground">Phone: <span className="font-semibold text-foreground">{order.customerPhone}</span></p>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</h4>
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-muted/10 border-b border-border">
                  <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-foreground">
                  {order.items.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No items available.</td></tr>
                  ) : (
                    order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">{item.productName}</td>
                        <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">₱{item.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">₱{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/10 font-bold text-foreground border-t border-border">
                    <td className="px-4 py-3">Total Amount</td>
                    <td className="px-4 py-3 text-right text-primary" colSpan={3}>₱{total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button onClick={onClose} className="h-11 px-6 border border-border text-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
