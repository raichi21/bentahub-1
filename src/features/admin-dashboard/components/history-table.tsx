"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Download, Eye, FileSpreadsheet, FileText } from "lucide-react"
import { TransactionHistoryModal } from "./transaction-history-modal"
import type { HistoryTransactionRowData } from "@/types/admin"

interface HistoryTableProps {
  transactions: HistoryTransactionRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  branches?: { id: string; name: string }[]
  branchId: string
  onBranchChange: (branchId: string) => void
  onExportPDF?: () => void
  loading: boolean
}

export function HistoryTable({
  transactions,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  branches = [],
  branchId,
  onBranchChange,
  onExportPDF,
  loading,
}: HistoryTableProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<HistoryTransactionRowData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const handleExport = () => {
    const headers = [
      "Date",
      "Transaction ID",
      "Branch",
      "Items",
      "Subtotal",
      "Total",
      "Payment",
      "Status",
    ]
    const rows = transactions.map((t) => [
      t.dateDisplay,
      t.displayId,
      t.branchName,
      String(t.itemsCount),
      t.subtotalDisplay,
      t.totalAmountDisplay,
      t.paymentMethodDisplay,
      t.statusDisplay,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentStyles: Record<string, string> = {
    cash: "bg-muted text-muted-foreground",
    gcash: "bg-accent text-primary",
  }

  const statusStyles: Record<string, string> = {
    completed:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800",
    pending:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    cancelled:
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800",
  }

  return (
    <>
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 px-6 py-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              All Branch Transactions
            </h3>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:w-auto">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ID, Branch..."
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 md:w-64"
                onChange={handleSearchChange}
              />
            </div>
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
                      handleExport()
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
          {loading && transactions.length === 0 ? (
            <div className="animate-pulse p-12 text-center text-sm text-muted-foreground">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No transactions found.
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-border bg-muted/10">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Items
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="transition-colors hover:bg-muted/10"
                  >
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                      {txn.dateDisplay}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {txn.displayId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {txn.branchName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {txn.itemsCount} items
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                      {txn.totalAmountDisplay}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase ${paymentStyles[txn.paymentMethod] || ""}`}
                      >
                        {txn.paymentMethodDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[txn.status] || ""}`}
                      >
                        {txn.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded p-1 text-primary transition-colors hover:bg-muted"
                          title="View Details"
                          onClick={() => setSelectedTransaction(txn)}
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
              Showing {start} to {end} of {totalCount} entries
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

      <TransactionHistoryModal
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </>
  )
}
