"use client"

import { X } from "lucide-react"
import type { PaymentRowData } from "@/types/admin"

interface PaymentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  payment: PaymentRowData | null
}

export function PaymentDetailsModal({ isOpen, onClose, payment }: PaymentDetailsModalProps) {
  if (!isOpen || !payment) return null

  const isVerified = payment.status === "completed"
  const methodStyles = payment.method === "cash"
    ? "bg-primary/10 text-primary"
    : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"

  const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
    pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Payment Details - {payment.displayId}</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${STATUS_STYLES[payment.status] || ""}`}>
              {payment.statusDisplay}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Transaction ID: <span className="font-semibold text-foreground">{payment.transactionDisplayId}</span></p>
                <p className="text-muted-foreground">Amount: <span className="font-semibold text-foreground">{payment.amountDisplay}</span></p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">Method:</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${methodStyles}`}>
                    {payment.methodDisplay}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Branch Location: <span className="font-semibold text-foreground">{payment.branchName}</span></p>
                <p className="text-muted-foreground">Date &amp; Time: <span className="font-semibold text-foreground">{payment.dateTimeDisplay}</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verification History</h3>
            <div className="relative space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              <div className="relative pl-8 flex items-start gap-4">
                <div className="absolute left-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background ring-offset-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">Payment Submitted</p>
                  <p className="text-xs text-muted-foreground">{payment.dateTimeDisplay} - Initial Entry</p>
                </div>
              </div>
              {isVerified && (
                <div className="relative pl-8 flex items-start gap-4">
                  <div className="absolute left-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-background ring-offset-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Payment Verified</p>
                    <p className="text-xs text-muted-foreground">{payment.dateTimeDisplay} - Auto-verified</p>
                  </div>
                </div>
              )}
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
