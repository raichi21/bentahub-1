"use client"

import { useState } from "react"
import { X, CheckCircle2 } from "lucide-react"

interface VerifyPickupModalProps {
  isOpen: boolean
  onClose: () => void
  type: "payment" | "pickup" | null
  item: {
    id: string
    customerName: string
    referenceNumber?: string
    amount?: number
    code?: string
    date: string
  } | null
  onConfirm: (id: string) => void
}

export function VerifyPickupModal({
  isOpen,
  onClose,
  type,
  item,
  onConfirm,
}: VerifyPickupModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen || !item || !type) return null

  const dateStr = new Date(item.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex w-full max-w-md animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            {type === "payment" ? "Verify Payment" : "Complete Pickup"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Customer
              </p>
              <p className="text-sm font-bold text-foreground">
                {item.customerName}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Date
              </p>
              <p className="font-mono text-xs text-foreground">{dateStr}</p>
            </div>
            {type === "payment" && item.referenceNumber && (
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Ref Number
                </p>
                <p className="font-mono text-xs font-bold text-foreground">
                  {item.referenceNumber}
                </p>
              </div>
            )}
            {type === "payment" && item.amount !== undefined && (
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Amount
                </p>
                <p className="font-mono text-sm font-bold text-primary">
                  ₱{item.amount.toFixed(2)}
                </p>
              </div>
            )}
            {type === "pickup" && item.code && (
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Pickup Code
                </p>
                <p className="font-mono text-sm font-bold text-foreground">
                  {item.code}
                </p>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors select-none hover:bg-muted/20">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-medium text-foreground">
              {type === "payment"
                ? "I confirm the payment reference is valid and has been received"
                : "I confirm the customer's identity and items have been handed over"}
            </span>
          </label>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              {type === "payment"
                ? "This action will mark the payment as verified and make the order ready for pickup."
                : "This action will complete the pickup process and remove this item from the queue."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            disabled={!confirmed}
            onClick={() => {
              onConfirm(item.id)
              setConfirmed(false)
            }}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 disabled:pointer-events-none disabled:opacity-40"
          >
            {type === "payment" ? "Confirm Verified" : "Complete Pickup"}
          </button>
        </div>
      </div>
    </div>
  )
}
