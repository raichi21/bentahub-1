"use client"

import { useState, useMemo, useRef } from "react"
import { Search, Eye, CreditCard, Banknote, X } from "lucide-react"
import type { StaffTransactionItem } from "@/types/staff"
import { cn } from "@/lib/utils"

interface LiveTransactionFeedProps {
  transactions: StaffTransactionItem[]
}

const PAGE_SIZE = 10

export function LiveTransactionFeed({ transactions }: LiveTransactionFeedProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedTxn, setSelectedTxn] = useState<StaffTransactionItem | null>(null)
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = paymentFilter === "All" || t.paymentMethod === paymentFilter.toLowerCase()
      const matchesStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase()
      return matchesSearch && matchesPayment && matchesStatus
    })
  }, [searchQuery, paymentFilter, statusFilter, transactions])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedTxn(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-lg font-bold text-foreground">Transaction Details - {`TRN-${String(transactions.length - transactions.findIndex((t) => t.id === selectedTxn.id)).padStart(5, "0")}`}</h3>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
                  selectedTxn.status === "cancelled"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : selectedTxn.status === "pending"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                )}>
                  {selectedTxn.status}
                </span>
                <button onClick={() => setSelectedTxn(null)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Info</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Transaction ID: <span className="font-semibold text-foreground">TRN-{String(transactions.length - transactions.findIndex((t) => t.id === selectedTxn.id)).padStart(5, "0")}</span></p>
                    <p className="text-muted-foreground">Date &amp; Time: <span className="font-semibold text-foreground">{new Date(selectedTxn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></p>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">Payment Method:</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {selectedTxn.paymentMethod === "gcash" ? (
                          <><CreditCard className="w-3 h-3 text-emerald-500" /> GCash</>
                        ) : (
                          <><Banknote className="w-3 h-3 text-amber-500" /> Cash</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Info</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Status: <span className="font-semibold text-foreground">{selectedTxn.status}</span></p>
                    <p className="text-muted-foreground">Total Amount: <span className="text-base font-bold text-primary">₱{selectedTxn.total.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">Items</h3>
                {selectedTxn.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No item details available.</p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-muted/10 border-b border-border">
                        <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="px-4 py-3 w-[50%]">Item</th>
                          <th className="px-4 py-3 text-center w-[15%]">Qty</th>
                          <th className="px-4 py-3 text-right w-[30%]">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 text-foreground">
                        {selectedTxn.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.productName}</td>
                            <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-medium">₱{item.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={() => setSelectedTxn(null)}
                className="h-11 px-6 border border-border text-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
          <h4 className="font-bold text-lg text-foreground">Transaction Monitoring</h4>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by transaction ID..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
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
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Date/Time</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Transaction ID</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Method</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Total</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Status</th>
                <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                    No transactions matched your query
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t, idx) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idx
                  const displayId = `TRN-${String(globalIdx + 1).padStart(5, "0")}`
                  const dateObj = new Date(t.date)
                  const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

                  return (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{formattedDate} · {formattedTime}</td>
                      <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{displayId}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] uppercase bg-muted text-muted-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[t.paymentMethod] || ""}`} />
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground whitespace-nowrap">₱{t.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] uppercase ${statusStyles[t.status] || ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[t.status] || ""}`} />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTxn(t)}
                            className="p-1 hover:bg-muted rounded text-primary transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
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

        {filteredTransactions.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/5">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {start} to {end} of {filteredTransactions.length} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
