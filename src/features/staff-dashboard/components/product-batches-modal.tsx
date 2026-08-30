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
  return formatPHDate(new Date(d), { month: "short", day: "numeric", year: "numeric" })
}

function getRemainingDays(expiry: string | null): number | null {
  if (!expiry) return null
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const STATUS_LABEL: Record<InventoryBatchItem["status"], string> = {
  "next-to-sell": "Next to Sell",
  normal: "Normal",
  expiring: "Expiring",
  out: "Out",
}

export function ProductBatchesModal({ isOpen, onClose, product }: ProductBatchesModalProps) {
  if (!isOpen || !product) return null

  const batches = product.batches ?? []
  const activeBatches = batches.filter((b) => b.quantity > 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Product Batches</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0 flex items-center justify-center">
              {product.image ? (
                <Image src={product.image} alt={product.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <Package className="w-6 h-6 text-muted-foreground opacity-50" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{product.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">SKU: {product.sku}</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Total stock: <span className="font-bold font-mono text-foreground">{product.stock} {product.unit}s</span>
                </span>
                <span>
                  Active batches: <span className="font-bold font-mono text-foreground">{activeBatches.length}</span>
                </span>
              </div>
            </div>
          </div>

          {activeBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No active batches</p>
              <p className="text-xs text-muted-foreground mt-1">Restock this product to create an inventory batch.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/10 border-b border-border">
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold">Batch No.</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold">Received</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold">Expiry</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-right">Remaining</th>
                      <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {batches.map((b) => {
                      const isHead = b.status === "next-to-sell"
                      const expiring = b.status === "expiring"
                      const out = b.status === "out"
                      const days = getRemainingDays(b.expiryDate)
                      return (
                        <tr key={b.id} className={cn("hover:bg-muted/10 transition-colors", isHead && "bg-primary/5", out && "opacity-50")}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono font-bold text-foreground">{b.batchNumber || "—"}</span>
                            {b.supplier && <span className="block text-[10px] text-muted-foreground">{b.supplier}</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(b.receivedDate)}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-mono", expiring ? "text-amber-600 font-bold" : isHead && b.expiryDate ? "text-foreground font-semibold" : "text-muted-foreground")}>
                              {formatDate(b.expiryDate)}
                              {expiring && days !== null ? ` (${days}d)` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-bold text-right text-foreground">
                            {b.quantity}/{b.originalQuantity}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap",
                              isHead
                                ? "bg-primary/10 text-primary border-primary/30"
                                : expiring
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : out
                                    ? "bg-muted text-muted-foreground border-border"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}>
                              {isHead && <Flame className="w-3 h-3" />}
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
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Next to Sell</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Expiring ≤30d</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Out</span>
                <span className="text-muted-foreground/70">Batches are consumed oldest-expiry / oldest-received first.</span>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
