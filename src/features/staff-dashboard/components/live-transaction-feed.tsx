"use client"

import { useState, useMemo } from "react"
import { Search, Eye, CreditCard, Banknote, X } from "lucide-react"
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
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                      <td className="p-4">
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
      </div>
    </>
  )
}
