"use client"

import { useState } from "react"
import { X, AlertTriangle, Loader2 } from "lucide-react"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"

export type WasteReason = "damaged" | "expired" | "lost" | "other"

const REASON_OPTIONS: Array<{ value: WasteReason; label: string }> = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "lost", label: "Lost" },
  { value: "other", label: "Other" },
]

interface WasteStockModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (
    productId: string,
    quantity: number,
    reason: WasteReason,
    notes?: string
  ) => Promise<number | null>
}

export function WasteStockModal({
  isOpen,
  onClose,
  product,
  onSave,
}: WasteStockModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState<WasteReason>("damaged")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen || !product) return null

  const maxQty = Math.max(0, product.stock ?? 0)
  const qty = Math.floor(Number(quantity) || 0)
  const isValid = qty >= 1 && qty <= maxQty && !submitting

  const handleSave = async () => {
    if (!isValid) return
    setSubmitting(true)
    setError("")
    try {
      const newStock = await onSave(
        product.id,
        qty,
        reason,
        notes.trim() || undefined
      )
      if (newStock !== null) {
        onClose()
      } else {
        setError("Failed to report waste. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-md animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Report Damage
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {product.name}
              </p>
            </div>
          </div>
          <button
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-mono font-bold text-foreground">
                {maxQty} {product.unit || "pcs"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Quantity (in {product.unit || "pcs"})
            </label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(0, Math.floor(Number(e.target.value) || 0))
                )
              }
              className="h-11 w-full rounded-lg border border-border bg-background px-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">
              Enter damaged units in base units. Max {maxQty}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as WasteReason)}
              className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {REASON_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cracked during delivery"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            className="h-11 rounded-lg px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={cn(
              "flex h-11 items-center gap-2 rounded-lg bg-amber-600 px-8 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Report Waste
          </button>
        </div>
      </div>
    </div>
  )
}
