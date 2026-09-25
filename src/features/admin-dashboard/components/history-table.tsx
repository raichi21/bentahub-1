"use client"

import { useState, useRef } from "react"
import { Search, Eye } from "lucide-react"
import { TransactionHistoryModal } from "./transaction-history-modal"
import { ExportMenu, TablePagination } from "@/components/data-table"
import { downloadCsv } from "@/lib/export-csv"
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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const handleExport = () => {
    downloadCsv(
      `history-${new Date().toISOString().split("T")[0]}.csv`,
      [
        "Date",
        "Transaction ID",
        "Branch",
        "Items",
        "Subtotal",
        "Total",
        "Payment",
        "Status",
      ],
      transactions.map((t) => [
        t.dateDisplay,
        t.displayId,
        t.branchName,
        String(t.itemsCount),
        t.subtotalDisplay,
        t.totalAmountDisplay,
        t.paymentMethodDisplay,
        t.statusDisplay,
      ])
    )
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
            <ExportMenu onExportCSV={handleExport} onExportPDF={onExportPDF} />
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

        <TablePagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          currentCount={transactions.length}
          onPageChange={onPageChange}
          unit="entries"
        />
      </section>

      <TransactionHistoryModal
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </>
  )
}
