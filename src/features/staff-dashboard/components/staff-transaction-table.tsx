"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import type { Transaction } from "@/types/cashier"
import { ReceiptModal } from "./receipt-modal"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 5

interface StaffTransactionTableProps {
  transactions: Transaction[]
}

export function StaffTransactionTable({ transactions }: StaffTransactionTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.cashier.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMethod = methodFilter === "All" || t.paymentMethod === methodFilter.toLowerCase()
      const matchesStatus = statusFilter === "All" || t.status === statusFilter.toLowerCase()
      return matchesSearch && matchesMethod && matchesStatus
    })
  }, [searchQuery, methodFilter, statusFilter, transactions])

  const totalItems = filteredTransactions.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const safePage = Math.min(currentPage, totalPages)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredTransactions, safePage])

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
      <ReceiptModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />

      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by transaction ID or cashier..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">Payment: All</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">Status: All</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
          <div className="h-8 border-r border-border mx-1"></div>
          <select className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">Branch: All</option>
            <option value="main">Main Branch</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/10 border-b border-border">
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date/Time</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Cashier</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-muted-foreground">No transaction records matched your query</td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
                const dateObj = new Date(t.date)
                const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                const formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                const itemsCount = t.items.reduce((sum, item) => sum + item.qty, 0)
                return (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-xs text-muted-foreground font-medium font-mono">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-muted-foreground">{formattedTime}</div>
                    </td>
                    <td className="p-4 text-xs font-mono font-bold text-foreground">{t.id}</td>
                    <td className="p-4 text-xs text-muted-foreground font-medium">{t.cashier}</td>
                    <td className="p-4 text-xs text-muted-foreground">{itemsCount} {itemsCount === 1 ? "item" : "items"}</td>
                    <td className="p-4 text-xs">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", t.paymentMethod === "gcash" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>{t.paymentMethod}</span>
                    </td>
                    <td className="p-4 text-sm font-mono font-bold text-foreground">₱{t.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", t.status === "completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : t.status === "cancelled" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-muted text-muted-foreground border-border")}>{t.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedTxn(t)} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"><FileText className="w-3.5 h-3.5" /><span>View Receipt</span></button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between mt-auto">
        <p className="text-xs text-muted-foreground font-medium font-mono">Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems} transactions</p>
        <div className="flex items-center gap-1.5">
          <button disabled={safePage === 1} onClick={() => setCurrentPage((c) => c - 1)} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-bold text-muted-foreground px-2 font-mono">Page {safePage} of {totalPages}</span>
          <button disabled={safePage === totalPages} onClick={() => setCurrentPage((c) => c + 1)} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}
