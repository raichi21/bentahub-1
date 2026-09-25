"use client"

import { useState } from "react"
import { FileX, Eye } from "lucide-react"
import { CashDrawerDetailsModal } from "./cash-drawer-details-modal"
import {
  ExportMenu,
  TablePagination,
  BranchSelect,
} from "@/components/data-table"
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
  const [selectedSession, setSelectedSession] = useState<CashDrawerRow | null>(
    null
  )

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
            <BranchSelect
              options={branches}
              value={branchId}
              onChange={onBranchChange}
            />
            <BranchSelect
              options={cashiers}
              value={cashierId}
              onChange={onCashierChange}
              allLabel="All Cashiers"
            />
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
            <ExportMenu
              onExportCSV={handleExportCsv}
              onExportPDF={onExportPDF}
            />
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
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            currentCount={sessions.length}
            onPageChange={onPageChange}
          />
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
