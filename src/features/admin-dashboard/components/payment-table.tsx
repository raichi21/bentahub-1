"use client"

import { useState } from "react"
import { Search, Eye, FileX } from "lucide-react"
import { PaymentDetailsModal } from "./payment-details-modal"
import { ExportMenu } from "@/components/data-table"
import { downloadCsv } from "@/lib/export-csv"
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
  const [selectedPayment, setSelectedPayment] = useState<PaymentRowData | null>(
    null
  )
  const [searchInput, setSearchInput] = useState("")

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  const handleExport = () => {
    downloadCsv(
      `payments-export-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Payment ID",
        "Transaction",
        "Amount",
        "Method",
        "Date & Time",
        "Branch",
        "Status",
      ],
      payments.map((p) => [
        p.displayId,
        p.transactionDisplayId,
        p.amountDisplay,
        p.methodDisplay,
        p.dateTimeDisplay,
        p.branchName,
        p.statusDisplay,
      ])
    )
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const methodStyles: Record<string, string> = {
    cash: "bg-primary/10 text-primary",
    gcash:
      "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  }

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    cancelled: "bg-destructive/10 text-destructive",
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <h4 className="text-lg font-bold text-foreground">Payment Records</h4>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full md:w-64"
            >
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ID or Branch..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
              />
            </form>
            <select
              value={branchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ExportMenu onExportCSV={handleExport} onExportPDF={onExportPDF} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && payments.length === 0 ? (
            <div className="animate-pulse p-12 text-center text-sm text-muted-foreground">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileX className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    No payment records found.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search or branch selection.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-[11px] font-bold tracking-widest uppercase">
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
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-primary/5"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {p.displayId}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {p.transactionDisplayId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {p.amountDisplay}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${methodStyles[p.method] || ""}`}
                      >
                        {p.methodDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {p.dateTimeDisplay}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {p.branchName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${statusStyles[p.status] || ""}`}
                      >
                        {p.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="rounded p-1 text-primary transition-colors hover:bg-muted"
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
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Showing {payments.length > 0 ? start : 0} to {end} of {totalCount}{" "}
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

      <PaymentDetailsModal
        isOpen={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </>
  )
}
