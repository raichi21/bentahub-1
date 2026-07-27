"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Plus, Minus, Package } from "lucide-react"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface QuickStockModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (productId: string, newStock: number, newReorderLevel: number) => void
}

const DEFAULT_THRESHOLD = 10

export function QuickStockModal({ isOpen, onClose, product, onSave }: QuickStockModalProps) {
  const [stock, setStock] = useState(product?.stock ?? 0)

  if (!isOpen || !product) return null

  const handleSave = () => {
    onSave(product.id, Math.max(0, stock), DEFAULT_THRESHOLD)
    onClose()
  }

  const status = stock === 0 ? "out-of-stock" : stock <= DEFAULT_THRESHOLD ? "low-stock" : "in-stock"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-lg font-bold text-foreground">Edit Stock - {product.sku}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0 flex items-center justify-center">
              {product.image ? (
                <Image src={product.image} alt={product.name} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <Package className="w-6 h-6 text-muted-foreground opacity-50" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{product.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">SKU: {product.sku}</p>
              <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Stock ({product.unit}s)</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStock((s) => Math.max(0, s - 10))}
                className="w-12 h-12 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center font-bold"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-12 text-center text-lg font-bold font-mono bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                onClick={() => setStock((s) => s + 10)}
                className="w-12 h-12 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center font-bold"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
              status === "in-stock" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              status === "low-stock" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-red-50 text-red-700 border-red-200"
            )}>
              {status === "in-stock" ? "In Stock" : status === "low-stock" ? "Low Stock" : "Out of Stock"}
            </span>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 border border-border text-muted-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 px-6 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
