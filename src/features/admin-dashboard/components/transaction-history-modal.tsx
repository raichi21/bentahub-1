"use client"

import { X } from "lucide-react"
import type { HistoryTransactionRowData } from "@/types/admin"

interface TransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: HistoryTransactionRowData | null
}

export function TransactionHistoryModal({ isOpen, onClose, transaction }: TransactionHistoryModalProps) {
  if (!isOpen || !transaction) return null

  const formatPrice = (value: number) => `₱${value.toFixed(2)}`

  const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Transaction Details - {transaction.displayId}</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${STATUS_STYLES[transaction.status] || ""}`}>
              {transaction.statusDisplay}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Date &amp; Time: <span className="font-semibold text-foreground">{transaction.dateDisplay}</span></p>
                <p className="text-muted-foreground">Branch: <span className="font-semibold text-foreground">{transaction.branchName}</span></p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">Payment Method:</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${transaction.paymentMethod === "cash" ? "bg-muted text-muted-foreground" : "bg-accent text-primary"}`}>
                    {transaction.paymentMethodDisplay}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Info</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Status: <span className="font-semibold text-foreground">{transaction.statusDisplay}</span></p>
                <p className="text-muted-foreground">Total Amount: <span className="text-base font-bold text-primary">{transaction.totalAmountDisplay}</span></p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-3">Items</h3>
            {transaction.items.length === 0 ? (
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
                    {transaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">{item.productName}</td>
                        <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatPrice(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button onClick={onClose} className="h-11 px-6 border border-border text-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
