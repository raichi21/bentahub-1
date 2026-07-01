"use client"

import { useState } from "react"
import { Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { PaymentDetailsModal } from "./payment-details-modal"
import type { PaymentRowData } from "@/types/admin"

interface PaymentTableProps {
  payments: PaymentRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  loading: boolean
}

export function PaymentTable({ payments, totalCount, page, pageSize, onPageChange, loading }: PaymentTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRowData | null>(null)

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const methodStyles: Record<string, string> = {
    cash: "bg-primary/10 text-primary",
    gcash: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  }

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    cancelled: "bg-destructive/10 text-destructive",
  }

  const paginationButtons = () => {
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)
    let s = Math.max(1, page - half)
    let e = Math.min(totalPages, s + maxVisible - 1)
    if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1)
    const buttons: React.ReactNode[] = []

    if (s > 1) {
      buttons.push(
        <button key={1} onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold">1</button>
      )
      if (s > 2) buttons.push(<span key="dots-s" className="px-1 text-xs text-muted-foreground">...</span>)
    }

    for (let i = s; i <= e; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${
            i === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border hover:bg-muted"
          }`}
        >{i}</button>
      )
    }

    if (e < totalPages) {
      if (e < totalPages - 1) buttons.push(<span key="dots-e" className="px-1 text-xs text-muted-foreground">...</span>)
      buttons.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded border border-border hover:bg-muted text-xs font-bold">{totalPages}</button>
      )
    }

    return buttons
  }

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-muted/20 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">Payment Records</h3>
        </div>

        <div className="overflow-x-auto">
          {loading && payments.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No payment records found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/10 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date &amp; Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-foreground">{p.displayId}</td>
                    <td className="px-6 py-4 font-mono text-sm text-foreground">{p.transactionDisplayId}</td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">{p.amountDisplay}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${methodStyles[p.method] || ""}`}>
                        {p.methodDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.dateTimeDisplay}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{p.branchName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[p.status] || ""}`}>
                        {p.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > pageSize && (
          <div className="px-6 py-4 bg-muted/5 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {start} to {end} of {totalCount} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {paginationButtons()}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <PaymentDetailsModal
        isOpen={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </>
  )
}
