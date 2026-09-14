"use client"

import { X } from "lucide-react"
import type { PaymentRowData } from "@/types/admin"

interface PaymentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  payment: PaymentRowData | null
}

export function PaymentDetailsModal({
  isOpen,
  onClose,
  payment,
}: PaymentDetailsModalProps) {
  if (!isOpen || !payment) return null

  const isVerified = payment.status === "completed"
  const methodStyles =
    payment.method === "cash"
      ? "bg-primary/10 text-primary"
      : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"

  const STATUS_STYLES: Record<string, string> = {
    completed:
      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    cancelled:
      "bg-destructive/10 text-destructive border border-destructive/20",
    pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Payment Details - {payment.displayId}
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[payment.status] || ""}`}
            >
              {payment.statusDisplay}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Transaction Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Transaction ID:{" "}
                  <span className="font-semibold text-foreground">
                    {payment.transactionDisplayId}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Amount:{" "}
                  <span className="font-semibold text-foreground">
                    {payment.amountDisplay}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">Method:</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${methodStyles}`}
                  >
                    {payment.methodDisplay}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Customer Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Branch Location:{" "}
                  <span className="font-semibold text-foreground">
                    {payment.branchName}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Date &amp; Time:{" "}
                  <span className="font-semibold text-foreground">
                    {payment.dateTimeDisplay}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Verification History
            </h3>
            <div className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-[2px] before:bg-border">
              <div className="relative flex items-start gap-4 pl-8">
                <div className="absolute left-0 h-4 w-4 rounded-full bg-primary ring-4 ring-background ring-offset-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Payment Submitted
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.dateTimeDisplay} - Initial Entry
                  </p>
                </div>
              </div>
              {isVerified && (
                <div className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-0 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background ring-offset-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      Payment Verified
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.dateTimeDisplay} - Auto-verified
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-foreground transition-all hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
