"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Eye, FileX, Download, FileSpreadsheet, FileText } from "lucide-react"
import { PaymentDetailsModal } from "./payment-details-modal"
import type { PaymentRowData } from "@/types/admin"

interface PaymentTableProps {
  payments: PaymentRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  branches?: { id: string; name: string }[]
  branchId: string
  onBranchChange: (branchId: string) => void
  onSearch: (query: string) => void
  onExportPDF?: () => void
  loading: boolean
}

export function PaymentTable({
  payments,
  totalCount,
  page,
  pageSize,
  onPageChange,
  branches = [],
  branchId,
  onBranchChange,
  onSearch,
  onExportPDF,
  loading,
}: PaymentTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRowData | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchInput)
  }

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
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
          <h4 className="font-bold text-lg text-foreground">Payment Records</h4>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ID or Branch..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </form>
            <select
              value={branchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all w-full md:w-auto justify-center"
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
        </div>

        <div className="overflow-x-auto">
          {loading && payments.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileX className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-foreground">No payment records found.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or branch selection.</p>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-[11px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Payment ID</th>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date &amp; Time</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{p.displayId}</td>
                    <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{p.transactionDisplayId}</td>
                    <td className="px-6 py-4 font-medium text-sm text-foreground">{p.amountDisplay}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${methodStyles[p.method] || ""}`}>
                        {p.methodDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-sm text-foreground">{p.dateTimeDisplay}</td>
                    <td className="px-6 py-4 font-medium text-sm text-foreground">{p.branchName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyles[p.status] || ""}`}>
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

        {totalCount > 0 && (
          <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-between items-center">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {payments.length > 0 ? start : 0} to {end} of {totalCount} results
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
