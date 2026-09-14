"use client"

import { X } from "lucide-react"
import type { SalesTransactionRowData } from "@/types/admin"

interface TransactionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: SalesTransactionRowData | null
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null

  const total = transaction.items.reduce((sum, item) => sum + item.subtotal, 0)
  const isGcash = transaction.paymentMethod.toLowerCase() === "gcash"

  const dateDisplay = new Date(transaction.createdAt).toLocaleDateString(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in print:hidden">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Transaction Details - {transaction.displayId}
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                isGcash
                  ? "border-blue-500/20 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              }`}
            >
              {transaction.paymentMethod}
            </span>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Transaction Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Transaction ID:{" "}
                  <span className="font-semibold text-foreground">
                    {transaction.displayId}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Cashier:{" "}
                  <span className="font-semibold text-foreground">
                    {transaction.cashierName || "—"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Branch:{" "}
                  <span className="font-semibold text-foreground">
                    {transaction.branchName}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Date &amp; Time:{" "}
                  <span className="font-semibold text-foreground">
                    {dateDisplay}
                  </span>
                </p>
                {transaction.receiptNumber != null && (
                  <p className="text-muted-foreground">
                    Receipt No.:{" "}
                    <span className="font-semibold text-foreground">
                      #{transaction.receiptNumber}
                    </span>
                  </p>
                )}
                {isGcash && transaction.gcashRef && (
                  <p className="text-muted-foreground">
                    GCash Ref:{" "}
                    <span className="font-semibold text-foreground">
                      {transaction.gcashRef}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Items
            </h4>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                  <thead className="border-b border-border bg-muted/10">
                    <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      <th className="px-3 py-3 sm:px-4">Product</th>
                      <th className="px-3 py-3 text-center sm:px-4">Qty</th>
                      <th className="px-3 py-3 text-right sm:px-4">Price</th>
                      <th className="px-3 py-3 text-right sm:px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-foreground">
                    {transaction.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-muted-foreground sm:px-4"
                        >
                          No items available.
                        </td>
                      </tr>
                    ) : (
                      transaction.items.map((item, idx) => (
                        <tr key={idx}>
                          <td
                            className="max-w-[160px] truncate px-3 py-3 sm:max-w-none sm:px-4"
                            title={item.productName}
                          >
                            {item.productName}
                          </td>
                          <td className="px-3 py-3 text-center font-medium whitespace-nowrap sm:px-4">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">
                            ₱{item.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">
                            ₱{item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/10 font-bold text-foreground">
                      <td className="px-3 py-3 text-right sm:px-4" colSpan={3}>
                        Total Amount
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-primary sm:px-4">
                        ₱
                        {(transaction.items.length > 0
                          ? total
                          : parseFloat(transaction.totalAmount)
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
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
