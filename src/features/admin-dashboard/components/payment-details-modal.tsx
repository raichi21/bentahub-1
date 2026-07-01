"use client"

import React from "react"
import { X, Printer } from "lucide-react"
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Payment Details - {payment.displayId}</h2>
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex flex-col items-center gap-1.5">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                isVerified
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : payment.status === "cancelled"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}>
                {payment.statusDisplay}
              </span>
              <span className="text-xs text-muted-foreground">
                {isVerified ? "Payment completed" : "Pending verification"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/5 p-4 rounded-xl border border-border">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Transaction ID</p>
                  <p className="text-sm font-mono font-medium text-foreground">{payment.transactionDisplayId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Amount</p>
                  <p className="text-base font-bold text-primary">{payment.amountDisplay}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Payment Method</p>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase ${methodStyles}`}>
                    {payment.methodDisplay}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Full Name</p>
                  <p className="text-sm text-foreground font-medium">Walk-in Customer</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Branch Location</p>
                  <p className="text-sm text-foreground font-medium">{payment.branchName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Date &amp; Time</p>
                  <p className="text-sm text-muted-foreground font-medium">{payment.dateTimeDisplay}</p>
                </div>
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

        <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end gap-3">
          <button type="button" className="h-11 px-6 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-all" onClick={onClose}>Close</button>
          <button type="button" className="h-11 px-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all" onClick={() => window.print()}>
            <Printer className="h-[18px] w-[18px]" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
