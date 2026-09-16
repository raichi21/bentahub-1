"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Bell, Eye, Plus, Minus } from "lucide-react"
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
  const { addToCart, updateCartItem, removeFromCart } = useCartActions()
  const { user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  // Select the whole item row so the stepper can read the server-reconciled
  // id. The find() element reference is stable across renders unless the
  // items array changes, so this does not cause re-render loops.
  const cartItem = useCartStore((s) => s.items.find((i) => i.productId === id))
  const inCartQty = cartItem?.quantity ?? 0

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
      const message =
        err instanceof Error ? err.message : "Failed to add to cart"
      setError(message)
      console.error(message)
    })
  }

  const handleDecrement = () => {
    if (!cartItem) return
    // Removing the last unit clears the row, so the card flips back to the
    // plain "Add to Cart" button (qty returns to 0 via the selector).
    if (inCartQty <= 1) {
      removeFromCart(cartItem.id).catch(() => {})
    } else {
      updateCartItem(cartItem.id, inCartQty - 1).catch(() => {})
    }
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

          {/* View Details Overlay (customer only — public has a View Details button) */}
          {!isPublic && (
            <button
              type="button"
              onClick={() => router.push(detailHref)}
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-border/40 bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
          )}

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
          <span className="mb-1.5 block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {category}
          </span>
          <h3 className="font-heading mb-1 line-clamp-1 text-[15px] font-semibold text-foreground transition-colors group-hover/link:text-primary">
            {name}
          </h3>
          <div className="mb-3 text-xs text-muted-foreground">
            {weight && <span>{weight}</span>}
            {weight && branch && <span> • </span>}
            {branch && <span>{branch}</span>}
          </div>

          <div className="mt-auto">
            <span className="mb-3 block text-base font-bold text-foreground">
              {price}
            </span>
          </div>
        </Link>

        <div>
          {isPublic ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-foreground hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
              onClick={() => router.push(detailHref)}
            >
              <Eye className="size-3.5" />
              View Details
            </Button>
          ) : isOutOfStock ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              disabled
            >
              <Bell className="size-3.5" />
              Notify Me
            </Button>
          ) : !isPublic && inCartQty > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDecrement}
                title={
                  inCartQty <= 1 ? "Remove from cart" : "Decrease quantity"
                }
                aria-label={
                  inCartQty <= 1 ? "Remove from cart" : "Decrease quantity"
                }
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
              >
                <Minus className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={atMax}
                title={atMax ? "Maximum stock reached" : "Add one more"}
                aria-label="Add one more"
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                <Plus className="size-4" />
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border border-blue-600 bg-white text-[10px] font-bold text-blue-600 shadow-sm">
                  {inCartQty}
                </span>
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={atMax}
              title={atMax ? "Maximum stock reached" : undefined}
            >
              <ShoppingCart className="size-3.5" />
              Add to Cart
            </Button>
          )}
          {!isPublic && error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
