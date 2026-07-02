"use client"

import { X, Printer } from "lucide-react"
import type { Transaction } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  if (!transaction) return null

  const dateObj = new Date(transaction.date)
  const formattedDate = dateObj.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  })

  const isCancelled = transaction.status === "cancelled"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col relative animate-in zoom-in duration-200">
        <div className="px-4 py-3 bg-muted/20 border-b border-border flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground">Transaction Receipt</span>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans relative">
          {isCancelled && (
            <div className="absolute inset-0 bg-red-500/5 backdrop-blur-2xs flex items-center justify-center pointer-events-none select-none">
              <span className="text-3xl font-black text-red-600/30 uppercase tracking-widest border-4 border-red-600/30 p-2 rounded-xl transform -rotate-12">Cancelled</span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-lg font-black text-foreground tracking-tight">BentaHub Retail</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Main Branch, Metro Manila</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Receipt ID: {transaction.id}</p>
          </div>

          <div className="border-t border-dashed border-border my-4"></div>

          <div className="space-y-1 text-xs text-muted-foreground font-medium">
            <div className="flex justify-between"><span>Date:</span><span className="font-mono text-foreground">{formattedDate}</span></div>
            <div className="flex justify-between"><span>Cashier:</span><span className="text-foreground">{transaction.cashier}</span></div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={cn("font-bold uppercase tracking-wider text-[10px]", isCancelled ? "text-red-500" : "text-emerald-600")}>{transaction.status}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-4"></div>

          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-xs">
                <div className="max-w-[70%]">
                  <p className="font-bold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.qty} x ₱{item.price.toFixed(2)}</p>
                </div>
                <span className="font-mono font-bold text-foreground">₱{(item.qty * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border my-4"></div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span className="font-mono text-foreground">₱{transaction.subtotal.toFixed(2)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-red-500 font-medium"><span>Discount</span><span className="font-mono">-₱{transaction.discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between items-baseline pt-2 text-sm font-black text-foreground">
              <span>Total Bill</span>
              <span className="font-mono text-primary text-base">₱{transaction.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-4"></div>

          <div className="space-y-1 text-xs text-muted-foreground font-medium">
            <div className="flex justify-between"><span>Payment Type:</span><span className="uppercase text-foreground font-bold">{transaction.paymentMethod}</span></div>
            <div className="flex justify-between"><span>Amount Paid:</span><span className="font-mono text-foreground">₱{transaction.amountPaid.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Change Due:</span><span className="font-mono text-foreground">₱{transaction.change.toFixed(2)}</span></div>
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] text-muted-foreground italic">Thank you for shopping with BentaHub!</p>
            <p className="text-[9px] text-muted-foreground font-mono mt-1">Please keep this receipt for return/refund requests</p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex gap-2">
          <button onClick={() => alert("Connecting to system receipt printer...")} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-xs font-bold hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5 shadow-xs">
            <Printer className="w-4 h-4" /><span>Print Receipt</span>
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-border hover:bg-muted rounded-xl text-xs font-bold text-muted-foreground transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}
