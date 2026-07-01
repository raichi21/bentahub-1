"use client"

import { useState, useRef } from "react"
import { Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { TransactionHistoryModal } from "./transaction-history-modal"
import type { HistoryTransactionRowData } from "@/types/admin"

interface HistoryTableProps {
  transactions: HistoryTransactionRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  loading: boolean
}

export function HistoryTable({ transactions, totalCount, page, pageSize, onPageChange, onSearch, loading }: HistoryTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<HistoryTransactionRowData | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const handleExport = () => {
    const headers = ["Date", "Transaction ID", "Branch", "Items", "Subtotal", "Total", "Payment", "Status"]
    const rows = transactions.map((t) => [
      t.dateDisplay, t.displayId, t.branchName, String(t.itemsCount),
      t.subtotalDisplay, t.totalAmountDisplay, t.paymentMethodDisplay, t.statusDisplay,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `history-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const paymentStyles: Record<string, string> = {
    cash: "bg-muted text-muted-foreground",
    gcash: "bg-accent text-primary",
  }

  const statusStyles: Record<string, string> = {
    completed: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800",
    pending: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    cancelled: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800",
  }

  const paginationButtons = () => {
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)
    let s = Math.max(1, page - half)
    let e = Math.min(totalPages, s + maxVisible - 1)
    if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1)
    const buttons: React.ReactNode[] = []

    if (s > 1) {
      buttons.push(
        <button key={1} onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted text-xs font-bold">1</button>
      )
      if (s > 2) buttons.push(<span key="dots-s" className="px-1 text-xs text-muted-foreground">...</span>)
    }

    for (let i = s; i <= e; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${
            i === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border hover:bg-muted"
          }`}
        >{i}</button>
      )
    }

    if (e < totalPages) {
      if (e < totalPages - 1) buttons.push(<span key="dots-e" className="px-1 text-xs text-muted-foreground">...</span>)
      buttons.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted text-xs font-bold">{totalPages}</button>
      )
    }

    return buttons
  }

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-muted/20 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">All Branch Transactions</h3>
            <p className="text-[11px] text-muted-foreground">Real-time update from all active branch registers.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ID, Branch..."
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
                onChange={handleSearchChange}
              />
            </div>
            <button
              onClick={handleExport}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              aria-label="Export transactions"
            >
              <Download className="h-[18px] w-[18px]" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && transactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No transactions found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/10 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{txn.dateDisplay}</td>
                    <td className="px-6 py-4 font-mono text-sm text-primary">{txn.displayId}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{txn.branchName}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{txn.itemsCount} items</td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground whitespace-nowrap">{txn.totalAmountDisplay}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${paymentStyles[txn.paymentMethod] || ""}`}>
                        {txn.paymentMethodDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[txn.status] || ""}`}>
                        {txn.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setSelectedTransaction(txn)}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > pageSize && (
          <div className="px-6 py-4 bg-muted/5 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{start} – {end}</span> of{" "}
              <span className="font-bold text-foreground">{totalCount.toLocaleString()}</span> entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {paginationButtons()}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
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
