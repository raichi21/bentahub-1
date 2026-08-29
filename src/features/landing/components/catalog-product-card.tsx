"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Bell, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCartActions } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useCartStore } from "@/stores/cartStore"

export interface CatalogProductCardProps {
  id: string
  name: string
  category: string
  price: string | number
  image: string
  stockStatus: "in-stock" | "low-stock" | "out-of-stock"
  weight?: string
  branch: string
  /** Per-branch stock limit (null = unknown). */
  availableStock?: number | null
  /** Base route for the detail link (e.g. "/catalog" or "/customer/catalog"). */
  basePath?: string
}

export function CatalogProductCard({
  id,
  name,
  category,
  price,
  image,
  stockStatus,
  weight,
  branch,
  availableStock,
  basePath = "/catalog",
}: CatalogProductCardProps) {
  const router = useRouter()
  const { addToCart } = useCartActions()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const inCartQty = useCartStore((s) => s.items.find((i) => i.productId === id)?.quantity ?? 0)

  const isOutOfStock = stockStatus === "out-of-stock"
  const isLowStock = stockStatus === "low-stock"
  const atMax = availableStock != null && inCartQty >= availableStock
  // The public landing catalog is browse-only (no Add to Cart).
  const isPublic = basePath === "/catalog"

  const detailHref = `${basePath}/${id}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`

  const handleAddToCart = () => {
    // Guests and non-customer roles (admin/staff/cashier) sign in as a
    // customer first — the customer cart API rejects other roles with 401.
    if (!user || user.role !== "customer") {
      router.push(`/login?redirect=${encodeURIComponent(detailHref)}`)
      return
    }
    if (atMax) return
    setError(null)
    const numericPrice =
      typeof price === "string" ? parseFloat(price.replace(/[₱,]/g, "")) : price
    addToCart(id, 1, branch, {
      productName: name,
      price: numericPrice,
      image,
      category,
      availableStock,
    }).catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to add to cart"
      setError(message)
      console.error(message)
    })
  }

  return (
    <div className={cn(
      "group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col h-full",
      isOutOfStock && "opacity-75"
    )}>
      {/* Image Container */}
      <Link href={detailHref} className="block">
        <div className="relative aspect-square bg-muted">
          <Image
            src={image}
            alt={name}
            fill
            className={cn(
              "object-cover transition-transform group-hover:scale-105",
              isOutOfStock && "grayscale"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          {/* View Details Overlay */}
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 shadow-sm text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>

          {/* Stock Badge */}
          <div className="absolute top-2 left-2">
            {stockStatus === "in-stock" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                In Stock
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                Out of Stock
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground bg-background/80 px-3 py-1.5 rounded-lg shadow-sm">
                Temporarily Unavailable
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={detailHref} className="flex-1 group/link">
          <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5 block">
            {category}
          </span>
          <h3 className="font-heading text-[15px] font-semibold text-foreground mb-1 line-clamp-1 group-hover/link:text-primary transition-colors">
            {name}
          </h3>
          <div className="text-xs text-muted-foreground mb-3">
            {weight && <span>{weight}</span>}
            {weight && branch && <span> • </span>}
            {branch && <span>{branch}</span>}
          </div>

          <div className="mt-auto">
            <span className="text-base font-bold text-foreground block mb-3">
              {price}
            </span>
          </div>
        </Link>

        <div>
          {isPublic ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/5"
              onClick={() => router.push(detailHref)}
            >
              <Eye className="size-3.5" />
              View Details
            </Button>
          ) : isOutOfStock ? (
            <Button size="sm" variant="outline" className="w-full gap-1.5" disabled>
              <Bell className="size-3.5" />
              Notify Me
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/5"
              onClick={handleAddToCart}
              disabled={atMax}
              title={atMax ? "Maximum stock reached" : undefined}
            >
              <ShoppingCart className="size-3.5" />
              {inCartQty > 0
                ? (atMax ? "Max Stock Reached" : `In Cart · ${inCartQty}`)
                : "Add to Cart"}
            </Button>
          )}
          {!isPublic && error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
