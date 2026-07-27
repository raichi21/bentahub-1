"use client"

import { useState, useMemo } from "react"
import { Search, Eye, CreditCard, Banknote, Package, X } from "lucide-react"
import type { StaffTransactionItem } from "@/types/staff"
import { cn } from "@/lib/utils"

interface LiveTransactionFeedProps {
  transactions: StaffTransactionItem[]
}

export function LiveTransactionFeed({ transactions }: LiveTransactionFeedProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [selectedTxn, setSelectedTxn] = useState<StaffTransactionItem | null>(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = paymentFilter === "All" || t.paymentMethod === paymentFilter.toLowerCase()
      const matchesStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase()
      return matchesSearch && matchesPayment && matchesStatus
    })
  }, [searchQuery, paymentFilter, statusFilter, transactions])

  return (
    <>
      {/* Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedTxn(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Transaction Details</h3>
              <button onClick={() => setSelectedTxn(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* ID & Status */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Transaction ID</p>
                  <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                    TRN-{String(transactions.length - transactions.findIndex((t) => t.id === selectedTxn.id)).padStart(5, "0")}
                  </p>
                </div>
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border",
                  selectedTxn.status === "cancelled"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : selectedTxn.status === "pending"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}>
                  {selectedTxn.status}
                </span>
              </div>

              {/* Date/Time */}
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {new Date(selectedTxn.date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Payment Method & Total */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Payment Method</p>
                  <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                    {selectedTxn.paymentMethod === "gcash" ? (
                      <><CreditCard className="w-4 h-4 text-emerald-500" /> GCash</>
                    ) : (
                      <><Banknote className="w-4 h-4 text-amber-500" /> Cash</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Amount</p>
                  <p className="text-lg font-black text-primary font-mono mt-0.5">₱{selectedTxn.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Items placeholder */}
              <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
                <Package className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-xs font-bold text-muted-foreground">Item details coming soon</p>
                <p className="text-[10px] text-muted-foreground/60 max-w-xs">
                  Individual items will appear here once the system records them per transaction.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/10">
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:brightness-110 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">Payment: All</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date/Time</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                    No transactions matched your query
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const displayId = `TRN-${String(idx + 1).padStart(5, "0")}`
                  const dateObj = new Date(t.date)
                  const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  const isCancelled = t.status === "cancelled"

                  return (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-xs text-muted-foreground font-medium font-mono">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-muted-foreground">{formattedTime}</div>
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-foreground">{displayId}</td>
                      <td className="p-4 text-xs">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", t.paymentMethod === "gcash" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                          {t.paymentMethod === "gcash" ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono font-bold text-foreground">₱{t.total.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", isCancelled ? "bg-red-50 text-red-700 border-red-200" : t.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedTxn(t)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
