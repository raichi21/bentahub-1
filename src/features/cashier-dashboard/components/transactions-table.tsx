"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { transactions } from "@/features/cashier-dashboard/data/transactions"
import { ReceiptModal } from "./receipt-modal"
import type { Transaction } from "@/types/cashier"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 5

export function TransactionsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Selected transaction to view receipt
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.cashier.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMethod =
        methodFilter === "All" || t.paymentMethod === methodFilter.toLowerCase()

      const matchesStatus =
        statusFilter === "All" || t.status === statusFilter.toLowerCase()

      return matchesSearch && matchesMethod && matchesStatus
    })
  }, [searchQuery, methodFilter, statusFilter])

  // Pagination calculations
  const totalItems = filteredTransactions.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const safePage = Math.min(currentPage, totalPages)

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredTransactions, safePage])

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
      {/* Receipts Drawer Modal */}
      <ReceiptModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />

      {/* Top Search & Filter Headers */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by transaction ID or cashier..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
          />
        </div>

        {/* Action Selects */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Method Selector */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">Payment: All</option>
            <option value="Cash">Cash</option>
            <option value="GCash">GCash</option>
          </select>

          {/* Status Selector */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">Status: All</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date/Time</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cashier</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Items Count</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Method</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bill</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                  No transaction log records matched your query
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
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

                const itemsCount = t.items.reduce((sum, item) => sum + item.qty, 0)

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Date/Time */}
                    <td className="p-4 text-xs text-slate-500 font-medium font-mono">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-slate-400">{formattedTime}</div>
                    </td>

                    {/* Transaction ID */}
                    <td className="p-4 text-xs font-mono font-bold text-slate-700">
                      {t.id}
                    </td>

                    {/* Cashier */}
                    <td className="p-4 text-xs text-slate-600 font-medium">
                      {t.cashier}
                    </td>

                    {/* Items count */}
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {itemsCount} {itemsCount === 1 ? "item" : "items"}
                    </td>

                    {/* Method */}
                    <td className="p-4 text-xs">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                          t.paymentMethod === "gcash"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                        )}
                      >
                        {t.paymentMethod}
                      </span>
                    </td>

                    {/* Total Bill */}
                    <td className="p-4 text-sm font-mono font-black text-slate-800">
                      ₱{t.total.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                          t.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : t.status === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTxn(t)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between mt-auto">
        <p className="text-xs text-slate-400 font-medium font-mono">
          Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)}-
          {Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems} transactions
        </p>

        <div className="flex items-center gap-1.5">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-600 px-2 font-mono">
            Page {safePage} of {totalPages}
          </span>

          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
