"use client"

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react"
import {
  CatalogToolbar,
  CategorySidebar
} from "@/features/customer-dashboard"
import { Pagination } from "@/features/customer-dashboard/components/pagination"
import { CatalogProductCard } from "@/features/landing/components/catalog-product-card"
import type { CatalogProductCardProps } from "@/features/landing/components/catalog-product-card"
import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useProducts } from "@/hooks/useProducts"
import { useCart } from "@/hooks/useCart"
import { useRouter, useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 12
const DEFAULT_CATEGORY = "All Products"
const DEFAULT_BRANCH = "Lourdes Main Branch"

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogPageInner />
    </Suspense>
  )
}

function CatalogLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  )
}

function CatalogPageInner() {
  const { products: fetchedProducts, fetchProducts, isLoading, error } = useProducts()
  const { itemCount, fetchCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") ?? DEFAULT_CATEGORY
  const currentBranch = searchParams.get("branch") ?? DEFAULT_BRANCH
  const rawPage = Number(searchParams.get("page") ?? "1")
  const currentPage = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage)
  const [searchQuery, setSearchQuery] = useState("")
  const [branches, setBranches] = useState<string[]>([])

  // Load cart from the server so the FAB badge reflects the real state
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  // Fetch branches from API
  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBranches(data.data.map((b: { name: string }) => b.name))
        }
      })
      .catch(() => {})
  }, [])

  const queryString = useCallback(
    (category: string, branch: string, page: number) => {
      const params = new URLSearchParams()
      if (category !== DEFAULT_CATEGORY) params.set("category", category)
      if (branch !== DEFAULT_BRANCH) params.set("branch", branch)
      if (page > 1) params.set("page", String(page))
      const query = params.toString()
      return `/catalog${query ? `?${query}` : ""}`
    },
    []
  )

  // Fetch products for the current branch. When the branch changes, abort
  // the previous in-flight request so its response can't overwrite the store
  // with products from the now-deselected branch.
  const lastBranchRef = useRef("")
  const fetchControllerRef = useRef<AbortController | null>(null)
  useEffect(() => {
    if (lastBranchRef.current === currentBranch && fetchedProducts.length > 0) return
    lastBranchRef.current = currentBranch
    fetchControllerRef.current?.abort()
    const controller = new AbortController()
    fetchControllerRef.current = controller
    fetchProducts({ branch: currentBranch, signal: controller.signal }).catch((error: unknown) => {
      // Aborted requests are handled (and ignored) inside the hook
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Failed to fetch products:", error)
      }
    })
    return () => {
      controller.abort()
      if (fetchControllerRef.current === controller) fetchControllerRef.current = null
    }
  }, [fetchProducts, currentBranch, fetchedProducts.length])

  const categoryChanged = useCallback(
    (category: string) => {
      router.push(queryString(category, currentBranch, 1))
    },
    [currentBranch, queryString, router]
  )

  const branchChanged = useCallback(
    (branch: string) => {
      router.push(queryString(currentCategory, branch, 1))
    },
    [currentCategory, queryString, router]
  )

  // Filter products client-side based on selected category, branch & search
  const displayProducts: CatalogProductCardProps[] = useMemo(() => {
    const source = fetchedProducts.length > 0 ? fetchedProducts : []

    const byCategory = currentCategory === DEFAULT_CATEGORY
      ? source
      : source.filter((p) => p.category === currentCategory)

    // Products already filtered by branch from API
    const query = searchQuery.toLowerCase().trim()
    const bySearch = query
      ? byCategory.filter((p) => p.name.toLowerCase().includes(query))
      : byCategory

    return bySearch.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: `₱${Number(p.price).toFixed(2)}`,
      image: p.image || "/images/dashboard/kopiko-blanca-twin-v2.png",
      stockStatus: p.stockStatus,
      weight: p.weight,
      branch: p.branch,
      availableStock: p.quantity ?? null,
    }))
  }, [fetchedProducts, currentCategory, searchQuery])

  const totalProducts = displayProducts.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const showingFrom = totalProducts === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1
  const showingTo = Math.min(totalProducts, safePage * ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage !== safePage) {
      router.replace(queryString(currentCategory, currentBranch, safePage))
    }
  }, [currentBranch, currentCategory, currentPage, queryString, router, safePage])

  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return displayProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [displayProducts, safePage])

  const pageChanged = useCallback(
    (page: number) => {
      router.push(queryString(currentCategory, currentBranch, page))
    },
    [currentBranch, currentCategory, queryString, router]
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <CatalogToolbar
        showingFrom={showingFrom}
        showingTo={showingTo}
        totalProducts={totalProducts}
        activeBranch={currentBranch}
        onBranchChange={branchChanged}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        branches={branches}
      />

      {/* Main Content Area with Sidebar */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-1">
          {/* Sidebar - Hidden on mobile */}
          <CategorySidebar
            activeCategory={currentCategory}
            onSelectCategory={categoryChanged}
            products={fetchedProducts}
          />

          {/* Product Grid Area */}
          <div className="flex-1 overflow-hidden">
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
                <CatalogProductCard key={product.id} {...product} />
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
