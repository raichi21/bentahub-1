"use client"

import { useState, useRef, useEffect } from "react"
import { Eye, Download, FileSpreadsheet, FileText } from "lucide-react"
import { PaymentDetailsModal } from "./payment-details-modal"
import type { PaymentRowData } from "@/types/admin"

interface PaymentTableProps {
  payments: PaymentRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onExportPDF?: () => void
  loading: boolean
}

export function PaymentTable({ payments, totalCount, page, pageSize, onPageChange, onExportPDF, loading }: PaymentTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRowData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleExport = () => {
    const headers = ["Payment ID", "Transaction", "Amount", "Method", "Date & Time", "Branch", "Status"]
    const rows = payments.map((p) => [
      p.displayId, p.transactionDisplayId, p.amountDisplay,
      p.methodDisplay, p.dateTimeDisplay, p.branchName, p.statusDisplay,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

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

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-muted/20 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">Payment Records</h3>
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all"
            >
              <Download className="h-[18px] w-[18px]" />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { handleExport(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Export as CSV (Excel)
                </button>
                <button
                  onClick={() => { onExportPDF?.(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
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
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="p-1 hover:bg-muted rounded text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
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
              Showing {start} to {end} of {totalCount} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
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
