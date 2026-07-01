"use client"

import { useState, useMemo, Fragment } from "react"
import { Search, ChevronDown, ChevronUp, CreditCard, Banknote, Package } from "lucide-react"
import type { StaffTransactionItem } from "@/types/staff"
import { cn } from "@/lib/utils"

interface LiveTransactionFeedProps {
  transactions: StaffTransactionItem[]
}

export function LiveTransactionFeed({ transactions }: LiveTransactionFeedProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [expandedTxn, setExpandedTxn] = useState<string | null>(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = paymentFilter === "All" || t.paymentMethod === paymentFilter.toLowerCase()
      const matchesStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase()
      return matchesSearch && matchesPayment && matchesStatus
    })
  }, [searchQuery, paymentFilter, statusFilter, transactions])

  return (
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
            <option value="Voided">Voided</option>
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
              filteredTransactions.map((t) => {
                const isExpanded = expandedTxn === t.id
                const dateObj = new Date(t.date)
                const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                const isVoided = t.status === "voided"

                return (
                  <Fragment key={t.id}>
                    <tr className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setExpandedTxn(isExpanded ? null : t.id)}>
                      <td className="p-4 text-xs text-muted-foreground font-medium font-mono">
                        <div>{formattedDate}</div>
                        <div className="text-[10px] text-muted-foreground">{formattedTime}</div>
                      </td>
                      <td className="p-4 text-xs font-mono font-bold text-foreground">{t.id}</td>
                      <td className="p-4 text-xs">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", t.paymentMethod === "gcash" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                          {t.paymentMethod === "gcash" ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono font-bold text-foreground">₱{t.total.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", isVoided ? "bg-red-50 text-red-700 border-red-200" : t.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${t.id}-detail`}>
                        <td colSpan={6} className="p-4 bg-muted/10 border-b border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</h4>
                              <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2">
                                <Package className="w-8 h-8 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">Item details coming soon</p>
                                <p className="text-[10px] text-muted-foreground/60">Individual items will appear here once the system records them per transaction.</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Summary</h4>
                              <div className="border border-border rounded-lg p-4 space-y-1.5 text-xs">
                                <div className="flex justify-between font-bold text-foreground">
                                  <span>Total</span>
                                  <span className="font-mono">₱{t.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground pt-1">
                                  <span>Payment Method</span>
                                  <span className="font-mono capitalize">{t.paymentMethod === "gcash" ? "GCash" : "Cash"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
