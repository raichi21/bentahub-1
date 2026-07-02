"use client"

import { useState } from "react"
import { X, Printer, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import type { Transaction } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
}

const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL || "http://localhost:3001"

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const [printing, setPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState<"idle" | "success" | "error">("idle")
  const [printMessage, setPrintMessage] = useState("")

  if (!transaction) return null

  const dateObj = new Date(transaction.date)
  const formattedDate = dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const isCancelled = transaction.status === "cancelled"

  const handlePrint = async () => {
    setPrinting(true)
    setPrintStatus("idle")
    setPrintMessage("")

    try {
      const res = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptNumber: transaction.receiptNumber,
          date: formattedDate,
          cashier: transaction.cashier,
          status: transaction.status,
          items: transaction.items,
          subtotal: transaction.subtotal,
          discount: transaction.discount,
          total: transaction.total,
          paymentMethod: transaction.paymentMethod,
          amountPaid: transaction.amountPaid,
          change: transaction.change,
        }),
      })

      const json = await res.json()

      if (json.success && json.printed) {
        setPrintStatus("success")
        setPrintMessage(json.message || "Receipt printed successfully")
      } else if (json.success) {
        setPrintStatus("success")
        setPrintMessage(json.message || "Receipt saved to file")
      } else {
        setPrintStatus("error")
        setPrintMessage(json.message || "Print failed")
      }
    } catch {
      setPrintStatus("error")
      setPrintMessage("Cannot connect to print server. Make sure it's running.")
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col relative animate-scale-up">
        {/* Header toolbar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">Transaction Receipt</span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Receipt Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans relative">
          {isCancelled && (
            <div className="absolute inset-0 bg-red-500/5 backdrop-blur-2xs flex items-center justify-center pointer-events-none select-none">
              <span className="text-3xl font-black text-red-600/30 uppercase tracking-widest border-4 border-red-600/30 p-2 rounded-xl transform -rotate-12">
                Cancelled
              </span>
            </div>
          )}

          {/* Business branding */}
          <div className="text-center">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">BentaHub Retail</h3>
            <p className="text-[10px] text-slate-400 font-medium">Main Branch, Metro Manila</p>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Receipt No: BH-{String(transaction.receiptNumber).padStart(6, "0")}</p>
          </div>

          <div className="border-t border-dashed border-slate-200 my-4"></div>

          {/* Details header */}
          <div className="space-y-1 text-xs text-slate-500 font-medium">
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-mono text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="text-slate-700">{transaction.cashier}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={cn(
                  "font-bold uppercase tracking-wider text-[10px]",
                  isCancelled ? "text-red-500" : "text-green-600"
                )}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-4"></div>

          {/* Items checklist */}
          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div key={item.productId} className="flex justify-between text-xs">
                <div className="max-w-[70%]">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.qty} x ₱{item.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  ₱{(item.qty * item.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 my-4"></div>

          {/* Totals log */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700">₱{transaction.subtotal.toFixed(2)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-red-500 font-medium">
                <span>Discount</span>
                <span className="font-mono">-₱{transaction.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 text-sm font-black text-slate-800">
              <span>Total Bill</span>
              <span className="font-mono text-primary text-base">₱{transaction.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-4"></div>

          {/* Payment receipt info */}
          <div className="space-y-1 text-xs text-slate-500 font-medium">
            <div className="flex justify-between">
              <span>Payment Type:</span>
              <span className="uppercase text-slate-700 font-bold">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-mono text-slate-700">₱{transaction.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change Due:</span>
              <span className="font-mono text-slate-700">₱{transaction.change.toFixed(2)}</span>
            </div>
          </div>

          {/* Thank you phrase */}
          <div className="text-center pt-4">
            <p className="text-[10px] text-slate-400 italic">Thank you for shopping with BentaHub!</p>
            <p className="text-[9px] text-slate-300 font-mono mt-1">Please keep this receipt for return/refund requests</p>
          </div>
        </div>

        {/* Print Status Banner */}
        {printStatus !== "idle" && (
          <div
            className={cn(
              "px-4 py-2 text-xs font-bold flex items-center gap-2 border-b",
              printStatus === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {printStatus === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{printMessage}</span>
          </div>
        )}

        {/* Action Panel */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-xs font-bold hover:brightness-110 transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 disabled:opacity-60 disabled:cursor-wait"
          >
            {printing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{printing ? "Printing..." : "Print Receipt"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-200/50 rounded-xl text-xs font-bold text-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
