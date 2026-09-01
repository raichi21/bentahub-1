"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText, FileX } from "lucide-react"

export interface CashDrawerRow {
  id: string
  displayId: string
  branchName: string
  cashierName: string
  openedAtDisplay: string
  closedAtDisplay: string | null
  startingCashDisplay: string
  expectedEndingCashDisplay: string
  actualEndingCashDisplay: string
  netCashImpactDisplay: string
  diff: number | null
  diffDisplay: string
  notes: string | null
  status: string
  statusDisplay: string
}

interface CashDrawerTableProps {
  sessions: CashDrawerRow[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  branches?: { id: string; name: string }[]
  branchId: string
  onBranchChange: (branchId: string) => void
  cashiers?: { id: string; name: string }[]
  cashierId: string
  onCashierChange: (cashierId: string) => void
  dateFrom: string
  dateTo: string
  onDateChange: (dateFrom: string, dateTo: string) => void
  onExportPDF?: () => void
  loading: boolean
}

export function CashDrawerTable({
  sessions,
  totalCount,
  page,
  pageSize,
  onPageChange,
  branches = [],
  branchId,
  onBranchChange,
  cashiers = [],
  cashierId,
  onCashierChange,
  dateFrom,
  dateTo,
  onDateChange,
  onExportPDF,
  loading,
}: CashDrawerTableProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleExportCsv = () => {
    const headers = ["Cash Drawer ID", "Branch", "Cashier", "Opened", "Closed", "Starting", "Expected", "Actual", "Net Impact", "Difference", "Status", "Notes"]
    const rows = sessions.map((s) => [
      s.displayId, s.branchName, s.cashierName, s.openedAtDisplay,
      s.closedAtDisplay || "", s.startingCashDisplay, s.expectedEndingCashDisplay,
      s.actualEndingCashDisplay, s.netCashImpactDisplay, s.diffDisplay, s.statusDisplay,
      (s.notes || "").replace(/,/g, " "),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `cash-drawer-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)
  const hasFilters = branchId || cashierId || dateFrom || dateTo

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <div>
          <h4 className="font-bold text-lg text-foreground">Cash Drawer Sessions</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Opens, closings, expected vs. actual cash, and reconciliation differences.
          </p>
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
          <select
            value={cashierId}
            onChange={(e) => onCashierChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">All Cashiers</option>
            {cashiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => onDateChange(e.target.value, dateTo)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          />
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => onDateChange(dateFrom, e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          />
          {hasFilters && (
            <button
              onClick={() => { onBranchChange(""); onCashierChange(""); onDateChange("", "") }}
              className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-sm font-bold transition-colors"
            >
              Clear
            </button>
          )}
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
                  onClick={() => { handleExportCsv(); setExportOpen(false) }}
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
        {loading && sessions.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading cash drawer sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileX className="h-8 w-8" />
              </div>
              <div>
                <p className="font-bold text-foreground">No cash drawer sessions found.</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
              </div>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" style={{ minWidth: 1020 }}>
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-[11px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4 whitespace-nowrap">ID / Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Branch / Cashier</th>
                <th className="px-6 py-4 whitespace-nowrap">Opened / Closed</th>
                <th className="px-6 py-4 whitespace-nowrap">Starting</th>
                <th className="px-6 py-4 whitespace-nowrap">Expected</th>
                <th className="px-6 py-4 whitespace-nowrap">Actual</th>
                <th className="px-6 py-4 whitespace-nowrap">Net Impact</th>
                <th className="px-6 py-4 whitespace-nowrap">Difference</th>
                <th className="px-6 py-4 whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-medium text-sm text-foreground">{s.displayId}</span>
                      <span className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        s.status === "open"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {s.statusDisplay}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-sm text-foreground">{s.branchName}</span>
                    <span className="block text-xs text-muted-foreground">{s.cashierName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="block text-sm text-foreground">{s.openedAtDisplay}</span>
                    <span className="block text-xs text-muted-foreground">{s.closedAtDisplay ?? "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{s.startingCashDisplay}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{s.expectedEndingCashDisplay}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{s.actualEndingCashDisplay}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{s.netCashImpactDisplay}</td>
                  <td className="px-6 py-4">
                    {s.status === "open" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${
                        s.diff === null
                          ? "text-muted-foreground"
                          : s.diff === 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : s.diff < 0
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {s.diffDisplay}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground max-w-[180px] truncate" title={s.notes ?? ""}>
                    {s.notes || "—"}
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
            Showing {sessions.length > 0 ? start : 0} to {end} of {totalCount} results
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
  )
}
