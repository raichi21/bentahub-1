"use client"

import { X } from "lucide-react"
import type { HistoryTransactionRowData } from "@/types/admin"

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: HistoryTransactionRowData | null
}

export function TransactionHistoryModal({
  isOpen,
  onClose,
  transaction,
}: TransactionHistoryModalProps) {
  if (!isOpen || !transaction) return null

  const formatPrice = (value: number) => `₱${value.toFixed(2)}`

  const STATUS_STYLES: Record<string, string> = {
    completed:
      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    cancelled:
      "bg-destructive/10 text-destructive border border-destructive/20",
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Transaction Details - {transaction.displayId}
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[transaction.status] || ""}`}
            >
              {transaction.statusDisplay}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Transaction Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Date &amp; Time:{" "}
                  <span className="font-semibold text-foreground">
                    {transaction.dateDisplay}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Branch:{" "}
                  <span className="font-semibold text-foreground">
                    {transaction.branchName}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">Payment Method:</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${transaction.paymentMethod === "cash" ? "bg-muted text-muted-foreground" : "bg-accent text-primary"}`}
                  >
                    {transaction.paymentMethodDisplay}
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
                    {transaction.statusDisplay}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Total Amount:{" "}
                  <span className="text-base font-bold text-primary">
                    {transaction.totalAmountDisplay}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-foreground">Items</h3>
            {transaction.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No item details available.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                    <thead className="border-b border-border bg-muted/10">
                      <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <th className="w-[50%] px-3 py-3 sm:px-4">Item</th>
                        <th className="w-[15%] px-3 py-3 text-center sm:px-4">
                          Qty
                        </th>
                        <th className="w-[30%] px-3 py-3 text-right sm:px-4">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-foreground">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx}>
                          <td
                            className="max-w-[200px] truncate px-3 py-3 sm:max-w-none sm:px-4"
                            title={item.productName}
                          >
                            {item.productName}
                          </td>
                          <td className="px-3 py-3 text-center font-medium whitespace-nowrap sm:px-4">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">
                            {formatPrice(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-foreground transition-all hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
