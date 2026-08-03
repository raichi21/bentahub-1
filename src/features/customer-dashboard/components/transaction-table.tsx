"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Eye, Trash2, Loader2 } from "lucide-react"
import { cn, formatOrderId } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import { TransactionActionModal } from "./transaction-action-modal"
import { DeleteTransactionModal } from "./delete-transaction-modal"
import type { Order } from "@/stores/ordersStore"

interface TransactionFilters {
  activeTab: string
  searchQuery: string
  dateFrom: string
}

export function TransactionTable({ filters }: { filters: TransactionFilters }) {
  const router = useRouter()
  const { orders, fetchOrders, isLoading, cancelOrder, deleteOrder } = useOrders()
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<{
    id: string; date: string; amount: string; status: string; method: string
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<{ rawId: string; displayId: string } | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!isLoading && orders.length === 0 && !hasFetched.current) {
      hasFetched.current = true
      fetchOrders()
    }
  }, [fetchOrders, isLoading, orders.length])

  // Reset page when filters change
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 0)
    return () => clearTimeout(timer)
  }, [filters.activeTab, filters.searchQuery, filters.dateFrom])

  // Convert orders to transaction format
  interface TransactionRow {
    id: string; date: string; amount: string; status: string; method: string; rawOrder: Order
  }
  const allTransactions = useMemo(() => {
    return orders
      .filter((o) => o.status === "completed" || o.status === "cancelled")
      .map((order) => ({
        id: formatOrderId(order.id),
        date: new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        }),
        amount: `₱${Number(order.totalAmount).toFixed(2)}`,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        method: order.paymentMethod === "cash" ? "Cash on Pickup" : "GCash",
        rawOrder: order,
      })) as TransactionRow[]
  }, [orders])

  // Apply filters
  const transactions = useMemo(() => {
    const query = filters.searchQuery.toLowerCase().trim()
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null
    if (fromDate) fromDate.setHours(0, 0, 0, 0)

    return allTransactions.filter((t) => {
      if (filters.activeTab === "Completed" && t.status !== "Completed") return false
      if (filters.activeTab === "Cancelled" && t.status !== "Cancelled") return false

      if (query && !t.id.toLowerCase().includes(query) && !t.amount.toLowerCase().includes(query)) return false

      if (fromDate && t.rawOrder) {
        const orderDate = new Date(t.rawOrder.createdAt)
        if (orderDate < fromDate) return false
      }

      return true
    })
  }, [allTransactions, filters])

  const itemsPerPage = 10
  const startIdx = (page - 1) * itemsPerPage
  const paginatedTransactions = transactions.slice(startIdx, startIdx + itemsPerPage)
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  if ((isLoading || !hasFetched.current) && orders.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-3 text-xs font-bold tracking-widest uppercase">Transaction ID</th>
              <th className="p-3 text-xs font-bold tracking-widest uppercase">Date</th>
              <th className="p-3 text-xs font-bold tracking-widest uppercase">Amount</th>
              <th className="p-3 text-xs font-bold tracking-widest uppercase">Payment Method</th>
              <th className="p-3 text-xs font-bold tracking-widest uppercase">Status</th>
              <th className="p-3 text-xs font-bold tracking-widest uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
            {paginatedTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => {
                  const raw = transaction.rawOrder
                  if (raw?.id) router.push(`/customer/orders/${raw.id}`)
                }}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="p-3 text-sm font-mono text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{transaction.id}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">{transaction.date}</td>
                <td className="p-3 text-sm font-bold text-foreground">{transaction.amount}</td>
                <td className="p-3 text-sm text-muted-foreground">{transaction.method}</td>
                <td className="p-3 text-sm">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    transaction.status === "Completed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    transaction.status === "Cancelled" && "bg-destructive/10 text-destructive"
                  )}>
                    {transaction.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedOrder(transaction.rawOrder ?? null)
                        setSelectedTransaction(transaction)
                        setIsModalOpen(true)
                      }}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const raw = transaction.rawOrder
                        if (raw?.id) {
                          setTransactionToDelete({ rawId: raw.id, displayId: transaction.id })
                          setDeleteModalOpen(true)
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-full hover:bg-destructive/10"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, transactions.length)} of {transactions.length} entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-muted-foreground px-2 font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && selectedTransaction && (
        <TransactionActionModal
          order={selectedOrder}
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedOrder(null); setSelectedTransaction(null) }}
          onCancelOrder={cancelOrder}
        />
      )}

      {deleteModalOpen && transactionToDelete && (
        <DeleteTransactionModal
          transactionId={transactionToDelete.displayId}
          isOpen={deleteModalOpen}
          onClose={() => { setDeleteModalOpen(false); setTransactionToDelete(null) }}
          onConfirm={async () => {
            await deleteOrder(transactionToDelete.rawId)
          }}
        />
      )}
    </div>
  )
}
