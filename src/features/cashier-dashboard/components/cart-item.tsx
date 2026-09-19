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
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-sm">
      {/* Thumbnail */}
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-6 w-6 text-muted-foreground opacity-40" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm leading-snug font-bold text-card-foreground">
          {product.name}
        </h4>
        <span className="font-mono text-[11px] text-muted-foreground">
          SKU: {product.sku}
        </span>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
            ₱{product.price.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border/40 bg-muted p-0.5">
          <button
            onClick={() => onUpdateQty(quantity - 1)}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-mono text-sm font-bold text-card-foreground">
            {quantity}
          </span>
          <button
            disabled={quantity >= product.stock}
            onClick={() => onUpdateQty(quantity + 1)}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-all duration-150 hover:bg-red-500 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
