"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffProductItem } from "@/types/staff"

interface UseCashierProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Product images are large base64 payloads (~5MB for a full catalog), so a
// fresh catalog fetch is cached and reloads within the TTL reuse it instead
// of re-downloading. The memory cache survives component remounts; the
// sessionStorage copy (best-effort — a full catalog can exceed the ~5MB
// quota) additionally survives page reloads within the tab session.
const PRODUCTS_CACHE_KEY = "bentahub:cashier-products:v1"
const PRODUCTS_CACHE_TTL_MS = 10 * 60 * 1000

interface ProductsCache {
  fetchedAt: number
  products: Product[]
}

let memoryCache: ProductsCache | null = null

function isFresh(cache: ProductsCache | null): cache is ProductsCache {
  return !!cache && Date.now() - cache.fetchedAt <= PRODUCTS_CACHE_TTL_MS
}

function readProductsCache(): Product[] | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(PRODUCTS_CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ProductsCache
        if (isFresh(parsed)) {
          memoryCache = parsed
          return parsed.products
        }
      }
    } catch {
      // Unreadable cache — fall through to the memory copy.
    }
  }
  if (isFresh(memoryCache)) return memoryCache.products
  return null
}

function writeProductsCache(products: Product[]): void {
  const cache: ProductsCache = { fetchedAt: Date.now(), products }
  memoryCache = cache
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Quota exceeded (catalog too large) — the memory cache still applies.
  }
}

export function useCashierProducts(): UseCashierProductsResult {
  const { token, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!token) return

    try {
      const res = await fetch("/api/staff/products", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) throw new Error("Failed to load products")

      const json = await res.json()

      const mapped: Product[] = (json.data?.products || []).map(
        (p: StaffProductItem) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          price: p.price,
          category: p.category as Product["category"],
          stock: p.stock,
          reorderLevel: p.reorderLevel,
          image: p.image || "",
          unit: p.unit || "pcs",
          nearestExpiry: p.nearestExpiry,
          sellByPack: p.sellByPack ?? false,
          packSize: p.packSize ?? 1,
          packPrice: p.packPrice ?? undefined,
        })
      )
      setProducts(mapped)
      setError(null)
      writeProductsCache(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFetched(true)
    }
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    // Fresh cache → skip the image-heavy network round trip entirely.
    // Applied in a microtask so no setState happens synchronously in the
    // effect (same rule as the fetch branch below).
    const cached = readProductsCache()
    if (cached) {
      void Promise.resolve().then(() => {
        if (cancelled) return
        setProducts(cached)
        setFetched(true)
      })
      return () => {
        cancelled = true
      }
    }

    // Fetch in a microtask so no setState happens synchronously in the effect
    void Promise.resolve().then(() => {
      if (!cancelled) return fetchProducts()
    })

    return () => {
      cancelled = true
    }
  }, [token, authLoading, fetchProducts])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  return { products, isLoading, error, refetch: fetchProducts }
}
