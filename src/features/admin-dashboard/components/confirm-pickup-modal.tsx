"use client"

import React, { useState } from "react"
import { X, Loader2 } from "lucide-react"
import type { PickupRowData } from "@/types/admin"

interface ConfirmPickupModalProps {
  isOpen: boolean
  onClose: () => void
  order: PickupRowData | null
  onConfirm: (orderId: string) => Promise<boolean>
}

export function ConfirmPickupModal({
  isOpen,
  onClose,
  order,
  onConfirm,
}: ConfirmPickupModalProps) {
  const [idVerified, setIdVerified] = useState(false)
  const [itemsChecked, setItemsChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen || !order) return null

  const total = order.items.reduce((sum, item) => sum + item.subtotal, 0)

  const isFormValid = idVerified && itemsChecked

  const handleConfirm = async () => {
    setSubmitting(true)
    setError("")
    try {
      const ok = await onConfirm(order.id)
      if (ok) {
        setIdVerified(false)
        setItemsChecked(false)
        onClose()
      } else {
        setError("Failed to confirm pickup. Please try again.")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Confirm Order Pickup - {order.displayId}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Customer
              </p>
              <p className="text-sm font-bold text-foreground">
                {order.customerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.customerEmail}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Branch
              </p>
              <p className="text-sm font-bold text-foreground">
                {order.branch}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-foreground uppercase">
              Order Summary
            </h3>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                      <th className="px-3 py-3 sm:px-4">Item</th>
                      <th className="px-3 py-3 text-center sm:px-4">Qty</th>
                      <th className="px-3 py-3 text-right sm:px-4">Price</th>
                      <th className="px-3 py-3 text-right sm:px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="text-sm text-foreground">
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-muted/10 font-bold text-foreground">
                      <td className="px-3 py-3 sm:px-4" colSpan={3}>
                        Total Amount
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-primary sm:px-4">
                        ₱{total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-widest text-foreground uppercase">
              Verification Checklist
            </h3>
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors select-none hover:bg-muted/20">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">
                  Identity Verified (Customer ID Checked)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors select-none hover:bg-muted/20">
                <input
                  type="checkbox"
                  checked={itemsChecked}
                  onChange={(e) => setItemsChecked(e.target.checked)}
                  className="h-5 w-5 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-foreground">
                  Items Checked (Order contents match summary)
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isFormValid || submitting}
            onClick={handleConfirm}
            className="flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 disabled:pointer-events-none disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm &amp; Complete Pickup
          </button>
        </div>
      </div>
    </div>
  )
}
