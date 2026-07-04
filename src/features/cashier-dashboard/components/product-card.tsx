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
        "flex flex-col bg-white rounded-2xl p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200 group text-left w-full relative overflow-hidden",
        isOutOfStock && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Product Image Panel */}
      <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-100 relative flex items-center justify-center">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="w-12 h-12 text-slate-400 opacity-40" />
        )}

        {/* Stock Badge */}
        <span
          className={cn(
            "absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md text-white shadow-sm",
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
      <div className="flex-1 flex flex-col justify-between">
        <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex justify-between items-end mt-auto">
          <p className="text-primary font-mono text-lg font-black">
            ₱{product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </button>
  )
}
