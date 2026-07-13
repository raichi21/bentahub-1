"use client"

import { Plus, Minus, Trash2, Package } from "lucide-react"
import type { CartItem as CartItemType } from "@/types/cashier"

interface CartItemProps {
  item: CartItemType
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}

export function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  const { product, quantity } = item

  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all duration-200">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border/50 flex items-center justify-center">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-6 h-6 text-muted-foreground opacity-40" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-card-foreground truncate leading-snug">
          {product.name}
        </h4>
        <span className="text-[11px] text-muted-foreground font-mono">
          SKU: {product.sku}
        </span>
        <div className="flex justify-between items-center mt-1.5">
          <p className="text-sm font-bold text-primary">
            ₱{product.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border/40">
          <button
            onClick={() => onUpdateQty(quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center text-sm font-mono font-bold text-card-foreground">
            {quantity}
          </span>
          <button
            disabled={quantity >= product.stock}
            onClick={() => onUpdateQty(quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-150"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
