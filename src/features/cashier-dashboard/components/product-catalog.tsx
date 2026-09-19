"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Search, Package, QrCode, CheckCircle, AlertCircle } from "lucide-react"
import { ProductCard } from "./product-card"
import { BarcodeScanner } from "./barcode-scanner"
import { findProductByBarcode } from "@/lib/barcode"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface ProductCatalogProps {
  products: Product[]
  isLoading?: boolean
  error?: string | null
  onAddProduct: (product: Product) => void
}

export function ProductCatalog({
  products,
  isLoading,
  error,
  onAddProduct,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [products])
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanFeedback, setScanFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const product = findProductByBarcode(products, barcode)

      if (product) {
        onAddProduct(product)
        setScanFeedback({ type: "success", message: `${product.name} added!` })
      } else {
        setScanFeedback({
          type: "error",
          message: `No product found with barcode "${barcode}"`,
        })
      }

      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
      feedbackTimeoutRef.current = setTimeout(() => setScanFeedback(null), 3000)
    },
    [products, onAddProduct]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, products])

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background p-4 md:p-6">
      {/* Search and Filter Panel */}
      <div className="sticky top-0 z-10 mb-6 flex flex-col gap-4 bg-background/95 py-1 backdrop-blur-md">
        {/* Search Input */}
        <div className="group relative w-full">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products (Ctrl + K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 pr-12 pl-12 text-sm shadow-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
            title="Scan barcode"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>

        {/* Scan Feedback Toast */}
        {scanFeedback && (
          <div
            className={cn(
              "flex animate-in items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-lg slide-in-from-top-2",
              scanFeedback.type === "success"
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
            )}
          >
            {scanFeedback.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {scanFeedback.message}
          </div>
        )}

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="mb-2 h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="h-8 w-8 text-red-500" />
            </div>
            <p className="mb-1 text-sm font-bold text-foreground">
              Failed to load products
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="text-sm font-semibold">No products found</span>
            <span className="text-xs">
              Try adjusting your filters or search query
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} onAdd={onAddProduct} />
            ))}
          </div>
        )}
      </div>

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  )
}
