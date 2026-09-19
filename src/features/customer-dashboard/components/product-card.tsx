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

export interface ProductCardProps {
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
}

export function ProductCard({
  id,
  name,
  category,
  price,
  image,
  stockStatus,
  weight,
  branch,
  availableStock,
}: ProductCardProps) {
  const router = useRouter()
  const { addToCart } = useCartActions()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  // Persistent in-cart quantity for this product. Subscribes to just this
  // product's row so the card only re-renders when its own quantity changes.
  const inCartQty = useCartStore(
    (s) => s.items.find((i) => i.productId === id)?.quantity ?? 0
  )

  const isOutOfStock = stockStatus === "out-of-stock"
  const isLowStock = stockStatus === "low-stock"
  const atMax = availableStock != null && inCartQty >= availableStock

  const detailHref = `/customer/catalog/${id}${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`

  const handleAddToCart = () => {
    // Guests sign in first — return them here after login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(detailHref)}`)
      return
    }
    if (atMax) return
    setError(null)
    // Fire-and-forget instant add: the store updates synchronously (the
    // button flips to "In Cart · N" immediately), the server call reconciles
    // in the background, and the store rolls back on failure. Never awaits
    // the round-trip so rapid taps stack units without locking the button.
    const numericPrice =
      typeof price === "string" ? parseFloat(price.replace(/[₱,]/g, "")) : price
    addToCart(id, 1, branch, {
      productName: name,
      price: numericPrice,
      image,
      category,
      availableStock,
    }).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Failed to add to cart"
      setError(message)
      console.error(message)
    })
  }

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
        isOutOfStock && "opacity-75"
      )}
    >
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
            className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm hover:bg-background"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>

          {/* Stock Badge */}
          <div className="absolute top-2 left-2">
            {stockStatus === "in-stock" && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                In Stock
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Out of Stock
              </span>
            )}
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <span className="rounded-lg bg-background/80 px-3 py-1.5 text-sm font-bold text-foreground shadow-sm">
                Temporarily Unavailable
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={detailHref} className="group/link flex-1">
          <span className="mb-1 block text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {category}
          </span>
          <h3 className="font-heading mb-1 line-clamp-1 text-base font-bold text-foreground transition-colors group-hover/link:text-primary">
            {name}
          </h3>
          <div className="mb-3 text-xs text-muted-foreground">
            {weight && <span>{weight}</span>}
            {weight && branch && <span> • </span>}
            {branch && <span>{branch}</span>}
          </div>

          <div className="mt-auto">
            <span className="mb-3 block text-lg font-bold text-primary">
              {price}
            </span>
          </div>
        </Link>

        <div>
          {isOutOfStock ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              disabled
            >
              <Bell className="size-3.5" />
              Notify Me
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={handleAddToCart}
              disabled={atMax}
              title={atMax ? "Maximum stock reached" : undefined}
            >
              <ShoppingCart className="size-3.5" />
              {inCartQty > 0
                ? atMax
                  ? "Max Stock Reached"
                  : `In Cart · ${inCartQty}`
                : "Add to Cart"}
            </Button>
          )}
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}
