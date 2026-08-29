"use client"

import { useState, useRef, useEffect } from "react"
import { FileX, Loader2, Download, FileSpreadsheet, FileText } from "lucide-react"
import type { SalesTransactionRowData } from "@/types/admin"
import { DateRangeFilter } from "./date-range-filter"

interface TransactionDetailsTableProps {
  transactions: SalesTransactionRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  branches?: { id: string; name: string }[]
  branchId: string
  onBranchChange: (branchId: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
  loading: boolean
  dateValue?: string
  onDateValueChange?: (value: string) => void
}

export function TransactionDetailsTable({
  transactions,
  totalCount,
  page,
  pageSize,
  onPageChange,
  branches = [],
  branchId,
  onBranchChange,
  onExportCSV,
  onExportPDF,
  loading,
  dateValue,
  onDateValueChange,
}: TransactionDetailsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <h4 className="font-bold text-lg text-foreground">Transaction Details</h4>
          <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full border border-border">
            {totalCount.toLocaleString()} transactions
          </span>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
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
                  onClick={() => { onExportCSV?.(); setExportOpen(false) }}
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
          <DateRangeFilter
            value={dateValue ?? ""}
            onChange={(v) => onDateValueChange?.(v)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-[11px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4">Date &amp; Time</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={6}>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-20 text-center" colSpan={6}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <FileX className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No records found for the selected filters.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your branch selection.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{t.displayId}</td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{t.branchName}</td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">
                    {new Date(t.createdAt).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">
                    ₱{parseFloat(t.totalAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${t.paymentMethod === "gcash"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-between items-center">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
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
    </section>
  )
}
