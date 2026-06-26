"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  CatalogToolbar,
  CategorySidebar,
  ProductCard,
  Pagination
} from "@/features/customer-dashboard"
import { ShoppingCart } from "lucide-react"
import type { ProductCardProps } from "@/features/customer-dashboard/components/product-card"
import Link from "next/link"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import { useRouter, useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 12
const DEFAULT_CATEGORY = "All Products"

export default function CatalogPage() {
  const { products: fetchedProducts, fetchProducts, isLoading, error } = useProducts()
  const { itemCount } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") ?? DEFAULT_CATEGORY
  const rawPage = Number(searchParams.get("page") ?? "1")
  const currentPage = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage)

  const queryString = useCallback(
    (category: string, page: number) => {
      const params = new URLSearchParams()
      if (category !== DEFAULT_CATEGORY) params.set("category", category)
      if (page > 1) params.set("page", String(page))
      const query = params.toString()
      return `/customer/catalog${query ? `?${query}` : ""}`
    },
    []
  )

  // Fetch ALL products once on mount — filter client-side
  const hasFetched = useRef(false)
  useEffect(() => {
    if (!hasFetched.current && !isLoading) {
      hasFetched.current = true
      fetchProducts().catch((error: unknown) => {
        console.error("Failed to fetch products:", error)
      })
    }
  }, [fetchProducts, isLoading])

  const categoryChanged = useCallback(
    (category: string) => {
      router.push(queryString(category, 1))
    },
    [queryString, router]
  )

  // Filter products client-side based on selected category
  const displayProducts: ProductCardProps[] = useMemo(() => {
    const source = fetchedProducts.length > 0 ? fetchedProducts : []

    const filtered = currentCategory === DEFAULT_CATEGORY
      ? source
      : source.filter((p) => p.category === currentCategory)

    return filtered.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: `₱${Number(p.price).toFixed(2)}`,
      image: p.image || "/images/dashboard/kopiko-blanca-twin-v2.png",
      stockStatus: p.stockStatus,
      weight: p.weight,
      branch: p.branch,
    }))
  }, [fetchedProducts, currentCategory])

  const totalProducts = displayProducts.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const showingFrom = totalProducts === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1
  const showingTo = Math.min(totalProducts, safePage * ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage !== safePage) {
      router.replace(queryString(currentCategory, safePage))
    }
  }, [currentCategory, currentPage, queryString, router, safePage])

  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return displayProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [displayProducts, safePage])

  const pageChanged = useCallback(
    (page: number) => {
      router.push(queryString(currentCategory, page))
    },
    [currentCategory, queryString, router]
  )

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6">
      {/* Toolbar */}
      <CatalogToolbar
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalProducts={totalProducts}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile */}
        <CategorySidebar
          activeCategory={currentCategory}
          onSelectCategory={categoryChanged}
          products={fetchedProducts}
        />

        {/* Product Grid Area */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {isLoading && !displayProducts.length && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={pageChanged}
          />
        </div>
      </div>

      {/* FAB Cart Button */}
      <Link
        href="/customer/cart"
        className="fixed bottom-20 right-6 md:bottom-6 md:right-6 size-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-40"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold text-destructive-foreground">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
        <span className="sr-only">View Cart</span>
      </Link>
    </div>
  )
}
