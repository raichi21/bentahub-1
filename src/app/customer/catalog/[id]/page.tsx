"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ShoppingCart, Package, Store, Tag, Weight, Clock, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProducts } from "@/hooks/useProducts"
import { useCartActions } from "@/hooks/useCart"
import { useAuth } from "@/hooks/useAuth"
import { useCartStore } from "@/stores/cartStore"
import { formatExpiryDate, getExpiryDays } from "@/lib/staff-utils"
import { cn } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentProduct, fetchProductById, isLoading, error } = useProducts()
  const { addToCart } = useCartActions()
  const { user } = useAuth()
  const [addError, setAddError] = useState<string | null>(null)

  const productId = params.id as string
  const branch = searchParams.get("branch")
  // Persistent in-cart quantity for this product, so the button reflects the
  // live cart state instantly and stays that way.
  const inCartQty = useCartStore((s) => s.items.find((i) => i.productId === productId)?.quantity ?? 0)

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
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
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
      const message = err instanceof Error ? err.message : "Failed to add to cart"
      setAddError(message)
      console.error("Failed to add to cart:", err)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !currentProduct) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">This product may be unavailable or no longer exists.</p>
        <Button onClick={() => router.push("/customer/catalog")}>
          Back to Catalog
        </Button>
      </div>
    )
  }

  const isOutOfStock = currentProduct.stockStatus === "out-of-stock"
  const atMax =
    currentProduct.quantity != null &&
    inCartQty >= currentProduct.quantity

  const expiryDays = getExpiryDays(currentProduct.nearestExpiry ?? null)
  const formattedExpiry = formatExpiryDate(currentProduct.nearestExpiry ?? null)
  const isExpiryUrgent = expiryDays !== null && expiryDays <= 7
  const isExpiryWarning = expiryDays !== null && expiryDays <= 30

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <div className="p-1 rounded-lg border border-border group-hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Product Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
          <Image
            src={currentProduct.image || "/images/dashboard/kopiko-blanca-twin-v2.png"}
            alt={currentProduct.name}
            fill
            className={cn(
              "object-cover",
              isOutOfStock && "grayscale opacity-75"
            )}
            sizes="(max-width: 768px) 100vw, 50vw"
          />

          {/* Stock Badge */}
          <div className="absolute top-4 left-4">
            {currentProduct.stockStatus === "in-stock" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                In Stock
              </span>
            )}
            {currentProduct.stockStatus === "low-stock" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col">
          {/* Category */}
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
            {currentProduct.category}
          </span>

          {/* Name */}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            {currentProduct.name}
          </h1>

          {/* Description */}
          {currentProduct.description && (
            <p className="text-muted-foreground mb-6 leading-relaxed">
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
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
              <Tag className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-medium text-foreground">{currentProduct.category}</p>
              </div>
            </div>
            {currentProduct.weight && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                <Weight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="text-sm font-medium text-foreground">{currentProduct.weight}</p>
                </div>
              </div>
            )}
            {currentProduct.branch && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                <Store className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="text-sm font-medium text-foreground">{currentProduct.branch}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
              <Clock className={cn("h-5 w-5 shrink-0", isExpiryUrgent ? "text-red-500" : isExpiryWarning ? "text-amber-500" : "text-muted-foreground")} />
              <div>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className={cn("text-sm font-medium", isExpiryUrgent ? "text-red-600 font-bold" : isExpiryWarning ? "text-amber-600 font-bold" : "text-foreground")}>
                  {formattedExpiry ?? "—"}
                  {expiryDays !== null && (isExpiryUrgent || isExpiryWarning) ? ` (${expiryDays}d)` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
              <Package className="h-5 w-5 text-muted-foreground shrink-0" />
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
            {isOutOfStock ? (
              <Button size="lg" className="w-full" disabled>
                Temporarily Unavailable
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
                disabled={atMax}
                title={atMax ? "Maximum stock reached" : undefined}
              >
                <ShoppingCart className="h-5 w-5" />
                {inCartQty > 0
                  ? (atMax ? "Max Stock Reached" : `In Cart · ${inCartQty}`)
                  : "Add to Cart"}
              </Button>
            )}
            {addError && (
              <p className="text-sm text-destructive text-center">{addError}</p>
            )}
            <Link
              href="/customer/catalog"
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
