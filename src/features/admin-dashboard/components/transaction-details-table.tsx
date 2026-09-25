"use client"

import { useState } from "react"
import { FileX, Loader2, Eye } from "lucide-react"
import type { SalesTransactionRowData } from "@/types/admin"
import { DateRangeFilter } from "./date-range-filter"
import { TransactionDetailsModal } from "./transaction-details-modal"
import { ExportMenu } from "@/components/data-table"

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
  const [viewingTransaction, setViewingTransaction] =
    useState<SalesTransactionRowData | null>(null)

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <h4 className="text-lg font-bold text-foreground">
            Transaction Details
          </h4>
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
            <ExportMenu onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
            <DateRangeFilter
              value={dateValue ?? ""}
              onChange={(v) => onDateValueChange?.(v)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-[11px] font-bold tracking-widest uppercase">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Date &amp; Time</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="px-6 py-20 text-center" colSpan={7}>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr className="group transition-colors hover:bg-muted/20">
                  <td className="px-6 py-20 text-center" colSpan={7}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FileX className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          No records found for the selected filters.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Try adjusting your branch selection.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="group transition-colors hover:bg-primary/5"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {t.displayId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {t.branchName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      ₱
                      {parseFloat(t.totalAmount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${
                          t.paymentMethod === "gcash"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        }`}
                      >
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-green-700 uppercase dark:bg-green-900/20 dark:text-green-400">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setViewingTransaction(t)}
                        className="rounded p-1 text-primary transition-colors hover:bg-muted"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} results
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
      </section>

      <TransactionDetailsModal
        key={
          viewingTransaction
            ? `details-${viewingTransaction.id}`
            : "details-closed"
        }
        isOpen={viewingTransaction !== null}
        onClose={() => setViewingTransaction(null)}
        transaction={viewingTransaction}
      />
    </>
  )
}
