"use client"

import { X } from "lucide-react"
import type { PickupRowData } from "@/types/admin"

interface PickupDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  order: PickupRowData | null
}

export function PickupDetailsModal({
  isOpen,
  onClose,
  order,
}: PickupDetailsModalProps) {
  if (!isOpen || !order) return null

  const total = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  const isCompleted = order.status === "completed"
  const scheduledDate = order.pickupDeadline
    ? new Date(order.pickupDeadline).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

  const statusStyles: Record<string, string> = {
    ready: "bg-accent/50 text-primary border border-primary/20",
    pending: "bg-muted text-muted-foreground border border-border",
    processing: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    completed:
      "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    cancelled:
      "bg-destructive/10 text-destructive border border-destructive/20",
  }

  const statusDot =
    order.status === "ready"
      ? "bg-primary animate-pulse"
      : order.status === "completed"
        ? "bg-emerald-500"
        : "bg-muted-foreground"

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in print:hidden">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Pickup Details - {order.displayId}
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[order.status] || ""}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusDot}`} />
              {order.statusDisplay}
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
                Order Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Order ID:{" "}
                  <span className="font-semibold text-foreground">
                    {order.displayId}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Scheduled Date:{" "}
                  <span className="font-semibold text-foreground">
                    {scheduledDate}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Branch:{" "}
                  <span className="font-semibold text-foreground">
                    {order.branch}
                  </span>
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Customer Info
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Full Name:{" "}
                  <span className="font-semibold text-foreground">
                    {order.customerName}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <span className="font-semibold text-foreground">
                    {order.customerEmail}
                  </span>
                </p>
                {order.customerPhone && (
                  <p className="text-muted-foreground">
                    Phone:{" "}
                    <span className="font-semibold text-foreground">
                      {order.customerPhone}
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
                    {order.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-6 text-center text-muted-foreground sm:px-4"
                        >
                          No items available.
                        </td>
                      </tr>
                    ) : (
                      order.items.map((item, idx) => (
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
                        ₱{total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Status History
            </h4>
            <div className="relative flex flex-col gap-6 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border before:content-['']">
              <div className="relative flex flex-col">
                <div className="absolute top-1.5 -left-[23px] h-3 w-3 rounded-full bg-emerald-500" />
                <p className="text-sm leading-tight font-bold text-foreground">
                  Order Placed
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="relative flex flex-col">
                <div className="absolute top-1.5 -left-[23px] h-3 w-3 rounded-full bg-emerald-500" />
                <p className="text-sm leading-tight font-bold text-foreground">
                  Ready for Pickup
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.pickupDeadline || "Waiting for confirmation"}
                </p>
              </div>
              {isCompleted && (
                <div className="relative flex flex-col">
                  <div className="absolute top-1.5 -left-[23px] h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <p className="text-sm leading-tight font-bold text-emerald-600">
                    Picked Up
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              )}
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
