"use client"

import Image from "next/image"
import { X, Package, Layers, Flame } from "lucide-react"
import type { Product, InventoryBatchItem } from "@/types/cashier"
import { formatPHDate } from "@/lib/date"
import { cn } from "@/lib/utils"

interface ProductBatchesModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

function formatDate(d: string | null): string {
  if (!d) return "—"
  return formatPHDate(new Date(d), {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getRemainingDays(expiry: string | null): number | null {
  if (!expiry) return null
  return Math.ceil(
    (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

const STATUS_LABEL: Record<InventoryBatchItem["status"], string> = {
  "next-to-sell": "Next to Sell",
  normal: "Normal",
  expiring: "Expiring",
  out: "Out",
}

export function ProductBatchesModal({
  isOpen,
  onClose,
  product,
}: ProductBatchesModalProps) {
  if (!isOpen || !product) return null

  const batches = product.batches ?? []
  const activeBatches = batches.filter((b) => b.quantity > 0)

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Product Batches</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-6">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <Package className="h-6 w-6 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {product.name}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                SKU: {product.sku}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Total stock:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {product.stock} {product.unit}
                  </span>
                </span>
                <span>
                  Active batches:{" "}
                  <span className="font-mono font-bold text-foreground">
                    {activeBatches.length}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {activeBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
              <p className="text-sm font-semibold text-foreground">
                No active batches
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Restock this product to create an inventory batch.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="px-4 py-3 text-[10px] font-bold tracking-wider uppercase">
                        Batch No.
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-wider uppercase">
                        Received
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-wider uppercase">
                        Expiry
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider uppercase">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {batches.map((b) => {
                      const isHead = b.status === "next-to-sell"
                      const expiring = b.status === "expiring"
                      const out = b.status === "out"
                      const days = getRemainingDays(b.expiryDate)
                      return (
                        <tr
                          key={b.id}
                          className={cn(
                            "transition-colors hover:bg-muted/10",
                            isHead && "bg-primary/5",
                            out && "opacity-50"
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-bold text-foreground">
                              {b.batchNumber || "—"}
                            </span>
                            {b.supplier && (
                              <span className="block text-[10px] text-muted-foreground">
                                {b.supplier}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDate(b.receivedDate)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "font-mono text-xs",
                                expiring
                                  ? "font-bold text-amber-600"
                                  : isHead && b.expiryDate
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground"
                              )}
                            >
                              {formatDate(b.expiryDate)}
                              {expiring && days !== null ? ` (${days}d)` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm font-bold text-foreground">
                            {b.quantity}/{b.originalQuantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold whitespace-nowrap",
                                isHead
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : expiring
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : out
                                      ? "border-border bg-muted text-muted-foreground"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              )}
                            >
                              {isHead && <Flame className="h-3 w-3" />}
                              {STATUS_LABEL[b.status]}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Next to
                  Sell
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                  Normal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                  Expiring ≤30d
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />{" "}
                  Out
                </span>
                <span className="text-muted-foreground/70">
                  Batches are consumed oldest-expiry / oldest-received first.
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
