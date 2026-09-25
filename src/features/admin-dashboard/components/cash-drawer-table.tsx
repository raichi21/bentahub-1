"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText, FileX, Eye } from "lucide-react"
import { CashDrawerDetailsModal } from "./cash-drawer-details-modal"
import { downloadCsv } from "@/lib/export-csv"
import { DateRangeFilter } from "./date-range-filter"

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
  const [selectedSession, setSelectedSession] = useState<CashDrawerRow | null>(
    null
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleExportCsv = () => {
    downloadCsv(
      `cash-drawer-export-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Cash Drawer ID",
        "Branch",
        "Cashier",
        "Opened",
        "Closed",
        "Starting",
        "Expected",
        "Actual",
        "Net Impact",
        "Difference",
        "Status",
        "Notes",
      ],
      sessions.map((s) => [
        s.displayId,
        s.branchName,
        s.cashierName,
        s.openedAtDisplay,
        s.closedAtDisplay || "",
        s.startingCashDisplay,
        s.expectedEndingCashDisplay,
        s.actualEndingCashDisplay,
        s.netCashImpactDisplay,
        s.diffDisplay,
        s.statusDisplay,
        (s.notes || "").replace(/,/g, " "),
      ])
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-lg font-bold text-foreground">
              Cash Drawer Sessions
            </h4>
          </div>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <select
              value={branchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary md:w-auto"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={cashierId}
              onChange={(e) => onCashierChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary md:w-auto"
            >
              <option value="">All Cashiers</option>
              {cashiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <DateRangeFilter
              value={dateFrom}
              label="From"
              max={dateTo || undefined}
              onChange={(v) => onDateChange(v, dateTo)}
            />
            <DateRangeFilter
              value={dateTo}
              label="To"
              min={dateFrom || undefined}
              onChange={(v) => onDateChange(dateFrom, v)}
            />
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-bold transition-all hover:bg-muted md:w-auto"
              >
                <Download className="h-[18px] w-[18px]" />
                Export
              </button>
              {exportOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <button
                    onClick={() => {
                      handleExportCsv()
                      setExportOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export as CSV (Excel)
                  </button>
                  <button
                    onClick={() => {
                      onExportPDF?.()
                      setExportOpen(false)
                    }}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
            <div className="animate-pulse p-12 text-center text-sm text-muted-foreground">
              Loading cash drawer sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileX className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    No cash drawer sessions found.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your filters.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <table
              className="w-full border-collapse text-left"
              style={{ minWidth: 900 }}
            >
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-[11px] font-bold tracking-widest uppercase">
                  <th className="px-6 py-4 whitespace-nowrap">ID</th>
                  <th className="px-6 py-4 whitespace-nowrap">Branch</th>
                  <th className="px-6 py-4 whitespace-nowrap">Opened</th>
                  <th className="px-6 py-4 whitespace-nowrap">Starting</th>
                  <th className="px-6 py-4 whitespace-nowrap">Expected</th>
                  <th className="px-6 py-4 whitespace-nowrap">Actual</th>
                  <th className="px-6 py-4 whitespace-nowrap">Net Impact</th>
                  <th className="px-6 py-4 whitespace-nowrap">Difference</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-primary/5"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {s.displayId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {s.branchName}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {s.openedAtDisplay}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {s.startingCashDisplay}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {s.expectedEndingCashDisplay}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {s.actualEndingCashDisplay}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {s.netCashImpactDisplay}
                    </td>
                    <td className="px-6 py-4">
                      {s.status === "open" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black ${
                            s.diff === null
                              ? "text-muted-foreground"
                              : s.diff === 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : s.diff < 0
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {s.diffDisplay}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-primary transition-colors hover:bg-muted"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Showing {sessions.length > 0 ? start : 0} to {end} of {totalCount}{" "}
              results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <CashDrawerDetailsModal
        key={selectedSession?.id ?? "none"}
        isOpen={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </>
  )
}
