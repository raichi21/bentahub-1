import { getStockStatus } from "@/lib/staff-utils"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"
import { Package } from "lucide-react"

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  disabled?: boolean
}

export function ProductCard({ product, onAdd, disabled }: ProductCardProps) {
  const stockStatus = getStockStatus(product)
  const isOutOfStock = stockStatus === "out-of-stock"
  const isLowStock = stockStatus === "low-stock"

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isOutOfStock || disabled}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md",
        isOutOfStock && "cursor-not-allowed opacity-60"
      )}
    >
      {/* Product Image Panel */}
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground opacity-40" />
        )}

        {/* Stock Badge */}
        <span
          className={cn(
            "absolute top-2 right-2 rounded px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md",
            isOutOfStock
              ? "bg-red-500/90"
              : isLowStock
                ? "bg-orange-500/90"
                : "bg-green-500/90"
          )}
        >
          {isOutOfStock
            ? "Out of Stock"
            : isLowStock
              ? `Low Stock (${product.stock})`
              : `${product.stock} In Stock`}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <h3 className="mb-2 line-clamp-2 text-sm leading-snug font-bold text-card-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between">
          <p className="font-mono text-lg font-black text-primary">
            ₱{product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </button>
  )
}
