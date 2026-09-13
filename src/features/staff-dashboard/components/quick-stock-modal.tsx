"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Plus, Minus, Package } from "lucide-react"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface BatchInfo {
  batchNumber?: string
  expiryDate?: string
  supplier?: string
}

interface QuickStockModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (
    productId: string,
    newStock: number,
    newReorderLevel: number,
    batchInfo?: BatchInfo
  ) => void
}

const DEFAULT_THRESHOLD = 10

export function QuickStockModal({
  isOpen,
  onClose,
  product,
  onSave,
}: QuickStockModalProps) {
  const [stock, setStock] = useState(product?.stock ?? 0)
  const [batchNumber, setBatchNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [supplier, setSupplier] = useState("")

  if (!isOpen || !product) return null

  const currentStock = product.stock
  const delta = Math.max(0, stock - currentStock)

  const handleSave = () => {
    onSave(product.id, Math.max(0, stock), DEFAULT_THRESHOLD, {
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      supplier: supplier.trim() || undefined,
    })
    onClose()
  }

  const status =
    stock === 0
      ? "out-of-stock"
      : stock <= DEFAULT_THRESHOLD
        ? "low-stock"
        : "in-stock"

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="flex max-h-[90vh] w-full max-w-md animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">
            Edit Stock - {product.sku}
          </h2>
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
            <div>
              <p className="text-sm font-bold text-foreground">
                {product.name}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                SKU: {product.sku}
              </p>
              <p className="text-xs text-muted-foreground">
                {product.category}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 rounded-lg border border-border">
            <div className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-mono font-bold text-foreground">
                {currentStock} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted-foreground">New total</span>
              <span className="font-mono font-bold text-primary">
                {Math.max(0, stock)} {product.unit}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted-foreground">Restock amount</span>
              <span className="font-mono font-bold text-emerald-600">
                {delta} {product.unit}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStock((s) => Math.max(0, s - 10))}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Minus className="h-5 w-5" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={stock}
                onChange={(e) =>
                  setStock(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="h-12 flex-1 rounded-lg border border-border bg-background text-center font-mono text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                onClick={() => setStock((s) => s + 10)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-border font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {delta > 0 && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold tracking-wider text-primary uppercase">
                New Delivery ({delta} {product.unit})
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Optional (e.g. DEL-0912)"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Status:
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                status === "in-stock"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : status === "low-stock"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              {status === "in-stock"
                ? "In Stock"
                : status === "low-stock"
                  ? "Low Stock"
                  : "Out of Stock"}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
