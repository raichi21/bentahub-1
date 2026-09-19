"use client"

import { useState, useMemo, useRef } from "react"
import { Search, Eye, CreditCard, Banknote, X } from "lucide-react"
import type { StaffTransactionItem } from "@/types/staff"
import { cn } from "@/lib/utils"

interface LiveTransactionFeedProps {
  transactions: StaffTransactionItem[]
}

const PAGE_SIZE = 10

export function LiveTransactionFeed({
  transactions,
}: LiveTransactionFeedProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedTxn, setSelectedTxn] = useState<StaffTransactionItem | null>(
    null
  )
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.id
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesPayment =
        paymentFilter === "All" ||
        t.paymentMethod === paymentFilter.toLowerCase()
      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter.toLowerCase()
      return matchesSearch && matchesPayment && matchesStatus
    })
  }, [searchQuery, paymentFilter, statusFilter, transactions])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / PAGE_SIZE)
  )
  const currentPage = Math.min(page, totalPages)
  const start =
    filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setSearchQuery(e.target.value)
      setPage(1)
    }, 300)
  }

  const dotColors: Record<string, string> = {
    cash: "bg-amber-500",
    gcash: "bg-emerald-500",
  }

  const statusStyles: Record<string, string> = {
    completed:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    pending:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    cancelled:
      "bg-destructive/10 text-destructive border border-destructive/20",
  }

  const statusDotColors: Record<string, string> = {
    completed: "bg-emerald-500",
    pending: "bg-amber-500",
    cancelled: "bg-destructive",
  }

  return (
    <>
      {/* Details Modal */}
      {selectedTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTxn(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <h3 className="text-lg font-bold text-foreground">
                Transaction Details -{" "}
                {`TRN-${String(transactions.length - transactions.findIndex((t) => t.id === selectedTxn.id)).padStart(5, "0")}`}
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                    selectedTxn.status === "cancelled"
                      ? "border-destructive/20 bg-destructive/10 text-destructive"
                      : selectedTxn.status === "pending"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  )}
                >
                  {selectedTxn.status}
                </span>
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Transaction Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Transaction ID:{" "}
                      <span className="font-semibold text-foreground">
                        TRN-
                        {String(
                          transactions.length -
                            transactions.findIndex(
                              (t) => t.id === selectedTxn.id
                            )
                        ).padStart(5, "0")}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Date &amp; Time:{" "}
                      <span className="font-semibold text-foreground">
                        {new Date(selectedTxn.date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">Payment Method:</p>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                        {selectedTxn.paymentMethod === "gcash" ? (
                          <>
                            <CreditCard className="h-3 w-3 text-emerald-500" />{" "}
                            GCash
                          </>
                        ) : (
                          <>
                            <Banknote className="h-3 w-3 text-amber-500" /> Cash
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Payment Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Status:{" "}
                      <span className="font-semibold text-foreground">
                        {selectedTxn.status}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Total Amount:{" "}
                      <span className="text-base font-bold text-primary">
                        ₱{selectedTxn.total.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="mb-3 text-sm font-bold text-foreground">
                  Items
                </h3>
                {selectedTxn.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No item details available.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="border-b border-border bg-muted/10">
                        <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                          <th className="w-[50%] px-4 py-3">Item</th>
                          <th className="w-[15%] px-4 py-3 text-center">Qty</th>
                          <th className="w-[30%] px-4 py-3 text-right">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 text-foreground">
                        {selectedTxn.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.productName}</td>
                            <td className="px-4 py-3 text-center font-medium">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ₱{item.price.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
              <button
                onClick={() => setSelectedTxn(null)}
                className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-foreground transition-all hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <h4 className="text-lg font-bold text-foreground">
            Transaction Monitoring
          </h4>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by transaction ID..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
            >
              <option value="All">Payment: All</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
            >
              <option value="All">Status: All</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Date/Time
                </th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Method
                </th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Total
                </th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-xs text-muted-foreground"
                  >
                    No transactions matched your query
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t, idx) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idx
                  const displayId = `TRN-${String(globalIdx + 1).padStart(5, "0")}`
                  const dateObj = new Date(t.date)
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  const formattedTime = dateObj.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <tr
                      key={t.id}
                      className="transition-colors hover:bg-muted/10"
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {formattedDate} · {formattedTime}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                        {displayId}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${dotColors[t.paymentMethod] || ""}`}
                          />
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold whitespace-nowrap text-foreground">
                        ₱{t.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusStyles[t.status] || ""}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusDotColors[t.status] || ""}`}
                          />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTxn(t)}
                            className="rounded p-1 text-primary transition-colors hover:bg-muted"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/5 px-6 py-4">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {start} to {end} of {filteredTransactions.length} entries
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
