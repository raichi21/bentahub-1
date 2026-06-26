"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, MoreHorizontal, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { cn, formatOrderId } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import { TransactionActionModal } from "./transaction-action-modal"
import type { Order } from "@/stores/ordersStore"

export function TransactionTable() {
  const router = useRouter()
  const { orders, fetchOrders, isLoading, cancelOrder } = useOrders()
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<{
    id: string; date: string; amount: string; status: string; method: string
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && orders.length === 0) {
      fetchOrders()
    }
  }, [fetchOrders, isLoading, orders.length])

  // Demo transactions fallback
  const demoTransactions = [
    {
      id: "#BH-0001",
      date: "May 15, 2026",
      amount: "₱1,250.00",
      status: "Successful",
      method: "GCash",
    },
    {
      id: "#BH-0002",
      date: "May 12, 2026",
      amount: "₱450.50",
      status: "Successful",
      method: "Cash on Pickup",
    },
    {
      id: "#BH-0003",
      date: "May 10, 2026",
      amount: "₱890.00",
      status: "Processing",
      method: "GCash",
    }
  ]

  // Convert orders to transaction format (hide cancelled)
  const transactions: Array<{
    id: string; date: string; amount: string; status: string; method: string; rawOrder?: Order
  }> = orders.length > 0
    ? orders
        .filter((o) => o.status !== "cancelled")
        .map((order) => ({
          id: formatOrderId(order.id),
          date: new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }),
          amount: `₱${Number(order.totalAmount).toFixed(2)}`,
          status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
          method: order.paymentMethod === "cash" ? "Cash on Pickup" : "GCash",
          rawOrder: order,
        }))
    : demoTransactions.map((t) => ({ ...t, rawOrder: undefined }))

  const itemsPerPage = 10
  const startIdx = (page - 1) * itemsPerPage
  const paginatedTransactions = transactions.slice(startIdx, startIdx + itemsPerPage)
  const totalPages = Math.ceil(transactions.length / itemsPerPage)

  if (isLoading && orders.length === 0) {
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
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Transaction ID
              </th>
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Date
              </th>
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Amount
              </th>
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Payment Method
              </th>
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Status
              </th>
              <th className="p-3 text-xs font-bold tracking-widest text-muted-foreground uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => router.push("/customer/orders")}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="p-3 text-sm font-mono text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{transaction.id}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {transaction.date}
                </td>
                <td className="p-3 text-sm font-bold text-foreground">
                  {transaction.amount}
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {transaction.method}
                </td>
                <td className="p-3 text-sm">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    transaction.status === "Completed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    (transaction.status === "Successful" || transaction.status === "Ready") && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                    (transaction.status === "Processing" || transaction.status === "Pending") && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    transaction.status === "Cancelled" && "bg-destructive/10 text-destructive"
                  )}>
                    {transaction.status}
                  </span>
                </td>
                <td className="p-3 text-sm text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOrder(transaction.rawOrder ?? null)
                      setSelectedTransaction(transaction)
                      setIsModalOpen(true)
                    }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
        <span className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{Math.min(itemsPerPage, paginatedTransactions.length)}</span> of <span className="font-medium text-foreground">{transactions.length}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-border disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-border disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isModalOpen && selectedTransaction && (
        <TransactionActionModal
          key={selectedOrder?.id ?? selectedTransaction.id}
          order={selectedOrder}
          transaction={selectedTransaction}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOrder(null)
            setSelectedTransaction(null)
          }}
          onCancelOrder={cancelOrder}
        />
      )}
    </div>
  )
}

