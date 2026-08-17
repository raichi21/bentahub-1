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
          unit: "pcs",
          nearestExpiry: p.nearestExpiry,
        }),
      )
      setProducts(mapped)
      setError(null)
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
