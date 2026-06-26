"use client"

import { useEffect, useState, use } from "react"
import { Loader2, Heart } from "lucide-react"
import { ProductBreadcrumb } from "@/features/customer-dashboard/components/product-breadcrumb"
import { ProductImageGallery } from "@/features/customer-dashboard/components/product-image-gallery"
import { ProductPricing } from "@/features/customer-dashboard/components/product-pricing"
import { ProductActions } from "@/features/customer-dashboard/components/product-actions"
import { ProductDetailsSection } from "@/features/customer-dashboard/components/product-details-section"
import { ProductSidebarSection } from "@/features/customer-dashboard/components/product-sidebar-section"
import { useCart } from "@/hooks/useCart"

interface ProductData {
  id: string
  name: string
  description: string
  category: string
  price: number
  bulkPrice?: number
  weight: string
  image: string
  stockStatus: "in-stock" | "low-stock" | "out-of-stock"
  quantity: number
  branch: string
  sku: string
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { addToCart } = useCart()
  const [isFavorite, setIsFavorite] = useState(false)

  const [product, setProduct] = useState<ProductData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetch(`/api/customer/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found")
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const payload = data.data ?? data
        setProduct({
          id: payload.id,
          name: payload.name,
          description: payload.description || "",
          category: payload.category || "Uncategorized",
          price: Number(payload.price),
          bulkPrice: payload.bulkPrice ? Number(payload.bulkPrice) : undefined,
          weight: payload.weight || "",
          image: payload.image || "/images/dashboard/kopiko-blanca-twin-v2.png",
          stockStatus: payload.stockStatus || "in-stock",
          quantity: Number(payload.quantity) || 0,
          branch: payload.branch || "Main Branch",
          sku: payload.sku || "",
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load product")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{error || "Product not found"}</p>
        <a href="/customer/catalog" className="text-primary hover:underline text-sm">
          Back to Catalog
        </a>
      </div>
    )
  }

  const retailPrice = `₱${product.price.toFixed(2)}`
  const bulkPriceStr = product.bulkPrice ? `₱${product.bulkPrice.toFixed(2)}` : undefined
  const stockCount = product.quantity

  const features = product.description
    ? product.description.split(". ").filter(Boolean).slice(0, 4).map((s) => s.trim())
    : []

  return (
    <div className="flex flex-col gap-6">
      <ProductBreadcrumb category={product.category} productName={product.name} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7">
          <ProductImageGallery image={product.image} name={product.name} />
        </div>

        {/* Right Column: Info & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{product.name}</h1>
              <span className="text-sm text-muted-foreground">{product.category}</span>
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle favorite"
            >
              <Heart className={`h-6 w-6 ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          </div>

          <ProductPricing
            retailPrice={retailPrice}
            bulkPrice={bulkPriceStr || retailPrice}
          />

          <ProductActions
            stockCount={stockCount}
            sku={product.sku}
            status={stockCount > 0 ? "Available" : "Out of Stock"}
            onAddToCart={async (quantity) => {
              await addToCart(product.id, quantity, product.branch)
            }}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2">
          <ProductDetailsSection
            description={product.description}
            features={features.length > 0 ? features : [product.weight ? `${product.weight}` : ""].filter(Boolean)}
            specs={[
              { label: "Weight / Volume", value: product.weight || "N/A" },
              { label: "SKU", value: product.sku || "N/A" },
              { label: "Category", value: product.category },
              { label: "Branch", value: product.branch },
            ]}
          />
        </div>
        <div className="lg:col-span-1">
          <ProductSidebarSection relatedProducts={[]} />
        </div>
      </div>
    </div>
  )
}
