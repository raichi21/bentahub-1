"use client"

import { X, FileText, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Order } from "@/stores/ordersStore"

interface TransactionActionModalProps {
  order: Order | null
  transaction: {
    id: string
    date: string
    amount: string
    status: string
    method: string
  }
  isOpen: boolean
  onClose: () => void
}

const statusColorMap: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
  Successful: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

export function TransactionActionModal({
  order,
  transaction,
  isOpen,
  onClose,
}: TransactionActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-base font-bold">Order Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold">{transaction.id}</span>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                statusColorMap[(order?.status ?? transaction.status).toLowerCase()] ?? "bg-muted text-muted-foreground"
              )}
            >
              {transaction.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-medium">{transaction.date}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Amount</p>
              <p className="font-bold text-base">{transaction.amount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Payment Method</p>
              <p className="font-medium">{transaction.method}</p>
            </div>
            {order?.branch && (
              <div>
                <p className="text-muted-foreground text-xs">Branch</p>
                <p className="font-medium">{order.branch}</p>
              </div>
            )}
          </div>

          {order && order.items && order.items.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                Order Items
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium text-right">Qty</th>
                      <th className="px-3 py-2 font-medium text-right">Price</th>
                      <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((item, i) => (
                      <tr key={item.id ?? i}>
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          ₱{Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ₱{Number(item.subtotal ?? item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {order?.notes && (
            <div>
              <p className="text-sm font-semibold mb-1">Notes</p>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{order.notes}</p>
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
