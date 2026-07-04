"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffProductItem } from "@/types/staff"

interface UseCashierProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
}

export function useCashierProducts(): UseCashierProductsResult {
  const { token, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchProducts() {
      try {
        const res = await fetch("/api/staff/products", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load products")

        const json = await res.json()

        if (cancelled) return

        const mapped: Product[] = (json.data?.products || []).map(
          (p: StaffProductItem) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            category: p.category as Product["category"],
            stock: p.stock,
            reorderLevel: p.reorderLevel,
            image: p.image || "",
            unit: "pcs",
          }),
        )
        setProducts(mapped)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) setFetched(true)
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  return { products, isLoading, error }
}
