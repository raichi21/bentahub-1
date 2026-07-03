"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Search, Package, QrCode, CheckCircle, AlertCircle } from "lucide-react"
import { ProductCard } from "./product-card"
import { BarcodeScanner } from "./barcode-scanner"
import type { Product } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface ProductCatalogProps {
  products: Product[]
  isLoading?: boolean
  error?: string | null
  onAddProduct: (product: Product) => void
}

const CATEGORIES = ["All", "Groceries", "Beverages", "Household", "Pharmacy", "Snacks", "Bakery"]

export function ProductCatalog({ products, isLoading, error, onAddProduct }: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const productBySku = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) {
      map.set(p.sku.toLowerCase(), p)
    }
    return map
  }, [products])

  const handleBarcodeScan = useCallback((barcode: string) => {
    const trimmed = barcode.trim().toLowerCase()
    const product = productBySku.get(trimmed)

    if (product) {
      onAddProduct(product)
      setScanFeedback({ type: "success", message: `${product.name} added!` })
    } else {
      setScanFeedback({ type: "error", message: `No product found with barcode "${barcode}"` })
    }

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => setScanFeedback(null), 3000)
  }, [productBySku, onAddProduct])

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
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, products])

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background p-4 md:p-6">
      {/* Search and Filter Panel */}
      <div className="flex flex-col gap-4 mb-6 sticky top-0 bg-background/95 backdrop-blur-md z-10 py-1">
        {/* Search Input */}
        <div className="relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products (Ctrl + K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm shadow-sm"
          />
          <button
            onClick={() => setIsScannerOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
            title="Scan barcode"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Feedback Toast */}
        {scanFeedback && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg animate-in slide-in-from-top-2",
              scanFeedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200",
            )}
          >
            {scanFeedback.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {scanFeedback.message}
          </div>
        )}

        {/* Category Scroll Container */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-none items-center">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary"
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse mb-4" />
            <div className="h-4 bg-muted rounded w-32 mb-2" />
            <div className="h-3 bg-muted rounded w-48" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">Failed to load products</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <span className="text-sm font-semibold">No products found</span>
            <span className="text-xs">Try adjusting your filters or search query</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-8">
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
