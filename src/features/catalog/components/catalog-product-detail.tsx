"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Store,
  Tag,
  Weight,
  Clock,
  Loader2,
  CheckCircle,
  Plus,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/hooks/useProducts"
import { useCartActions } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useCartStore } from "@/stores/cartStore"
import { formatExpiryDate, getExpiryDays } from "@/lib/staff-utils"
import { cn } from "@/lib/utils"

interface CatalogProductDetailProps {
  /** Base route for links (e.g. "/catalog" or "/customer/catalog"). */
  basePath: string
}

export function CatalogProductDetail({ basePath }: CatalogProductDetailProps) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentProduct, fetchProductById, isLoading, error } = useProducts()
  const { addToCart, updateCartItem, removeFromCart } = useCartActions()
  const { user } = useAuth()
  const [addError, setAddError] = useState<string | null>(null)

  const productId = params.id as string
  const branch = searchParams.get("branch")
  // Persistent in-cart row for this product so the stepper can read both
  // the live quantity and the server-reconciled item id. The find() element
  // reference is stable across renders unless the items array changes.
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === productId)
  )
  const inCartQty = cartItem?.quantity ?? 0

  useEffect(() => {
    if (productId) {
      fetchProductById(productId, branch ?? undefined).catch(() => {
        // Product not found — handled via error state
      })
    }
  }, [productId, branch, fetchProductById])

  const handleAddToCart = () => {
    if (!currentProduct) return
    // Guests sign in first — return them to this product after login
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      )
      return
    }
    setAddError(null)
    // Fire-and-forget instant add: the store updates synchronously (button
    // flips to "In Cart · N" immediately), the server call reconciles in the
    // background, and the store rolls back on failure.
    addToCart(currentProduct.id, 1, currentProduct.branch, {
      productName: currentProduct.name,
      price: Number(currentProduct.price),
      image: currentProduct.image,
      category: currentProduct.category,
      availableStock: currentProduct.quantity ?? null,
    }).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Failed to add to cart"
      setAddError(message)
      console.error("Failed to add to cart:", err)
    })
  }

  const handleDecrement = () => {
    if (!cartItem || !currentProduct) return
    if (inCartQty <= 1) {
      removeFromCart(cartItem.id).catch(() => {})
    } else {
      updateCartItem(cartItem.id, inCartQty - 1).catch(() => {})
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !currentProduct) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Product Not Found
        </h2>
        <p className="mb-6 text-muted-foreground">
          This product may be unavailable or no longer exists.
        </p>
        <Button onClick={() => router.push(basePath)}>Back to Catalog</Button>
      </div>
    )
  }

  const isOutOfStock = currentProduct.stockStatus === "out-of-stock"
  const atMax =
    currentProduct.quantity != null && inCartQty >= currentProduct.quantity
  // The public landing detail page is browse-only (no Add to Cart).
  const isPublic = basePath === "/catalog"

  const expiryDays = getExpiryDays(currentProduct.nearestExpiry ?? null)
  const formattedExpiry = formatExpiryDate(currentProduct.nearestExpiry ?? null)
  const isExpiryUrgent = expiryDays !== null && expiryDays <= 7
  const isExpiryWarning = expiryDays !== null && expiryDays <= 30

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="group mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="rounded-lg border border-border p-1 transition-colors group-hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        {/* Left: Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
          <Image
            src={
              currentProduct.image ||
              "/images/dashboard/kopiko-blanca-twin-v2.png"
            }
            alt={currentProduct.name}
            fill
            className={cn(
              "object-cover",
              isOutOfStock && "opacity-75 grayscale"
            )}
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Stock Badge */}
          <div className="absolute top-4 left-4">
            {currentProduct.stockStatus === "in-stock" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                In Stock
              </span>
            )}
            {currentProduct.stockStatus === "low-stock" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col">
          {/* Category */}
          <span className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {currentProduct.category}
          </span>

          {/* Name */}
          <h1 className="mb-4 text-3xl font-bold text-foreground lg:text-4xl">
            {currentProduct.name}
          </h1>

          {/* Description */}
          {currentProduct.description && (
            <p className="mb-6 leading-relaxed text-muted-foreground">
              {currentProduct.description}
            </p>
          )}

          {/* Price */}
          <div className="mb-6">
            <span className="text-4xl font-bold text-primary">
              ₱{Number(currentProduct.price).toFixed(2)}
            </span>
            {currentProduct.bulkPrice && (
              <span className="ml-3 text-sm text-muted-foreground line-through">
                ₱{Number(currentProduct.bulkPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Product Details Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <Tag className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">
                  {currentProduct.category}
                </p>
              </div>
            </div>
            {currentProduct.weight && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                <Weight className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentProduct.weight}
                  </p>
                </div>
              </div>
            )}
            {currentProduct.branch && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                <Store className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentProduct.branch}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <Clock
                className={cn(
                  "h-5 w-5 shrink-0",
                  isExpiryUrgent
                    ? "text-red-500"
                    : isExpiryWarning
                      ? "text-amber-500"
                      : "text-muted-foreground"
                )}
              />
              <div>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isExpiryUrgent
                      ? "font-bold text-red-600"
                      : isExpiryWarning
                        ? "font-bold text-amber-600"
                        : "text-foreground"
                  )}
                >
                  {formattedExpiry ?? "—"}
                  {expiryDays !== null && (isExpiryUrgent || isExpiryWarning)
                    ? ` (${expiryDays}d)`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
              <Package className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="text-sm font-medium text-foreground">
                  {currentProduct.quantity} available
                </p>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="mt-auto space-y-3">
            {isPublic ? (
              <></>
            ) : isOutOfStock ? (
              <Button size="lg" className="w-full" disabled>
                Temporarily Unavailable
              </Button>
            ) : inCartQty > 0 ? (
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  title={
                    inCartQty <= 1 ? "Remove from cart" : "Decrease quantity"
                  }
                  aria-label={
                    inCartQty <= 1 ? "Remove from cart" : "Decrease quantity"
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={atMax}
                  title={atMax ? "Maximum stock reached" : "Add one more"}
                  aria-label="Add one more"
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  <Plus className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-blue-600 bg-white text-[10px] font-bold text-blue-600 shadow-sm">
                    {inCartQty}
                  </span>
                </button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleAddToCart}
                disabled={atMax}
                title={atMax ? "Maximum stock reached" : undefined}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            )}
            {!isPublic && addError && (
              <p className="text-center text-sm text-destructive">{addError}</p>
            )}
            <Link
              href={basePath}
              className="block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
