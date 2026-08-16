import { useCallback, useRef } from "react"
import { useProductsStore, type Product } from "@/stores/productsStore"

export function useProducts() {
  const productsStore = useProductsStore()
  const inflightRef = useRef(0)

  /**
   * Fetch all products from backend
   * Supports optional filters: category, branch
   *
   * Pass an `AbortSignal` to cancel a superseded request (e.g. when the
   * customer switches branch). An aborted request is ignored entirely —
   * it never writes to the store or surfaces an error, so a stale response
   * can't overwrite the products of the currently selected branch.
   */
  const fetchProducts = useCallback(
    async (filters?: { category?: string; branch?: string; signal?: AbortSignal }) => {
      inflightRef.current++
      try {
        productsStore.setLoading(true)
        productsStore.setError(null)

        const params = new URLSearchParams()
        if (filters?.category) params.append("category", filters.category)
        if (filters?.branch) params.append("branch", filters.branch)

        const query = params.toString()
        const url = `/api/customer/products${query ? `?${query}` : ""}`

        const response = await fetch(url, filters?.signal ? { signal: filters.signal } : undefined)
        if (!response.ok) throw new Error("Failed to fetch products")

        const data = await response.json()
        const products: Product[] = (data.data ?? data ?? []).map((p: Record<string, unknown>) => ({
          ...p,
          createdAt: new Date(p.createdAt as string),
          updatedAt: new Date(p.updatedAt as string),
        })) as Product[]

        productsStore.setProducts(products)
        return products
      } catch (error) {
        // A superseded request — ignore silently (the newer request owns the store).
        if (error instanceof Error && error.name === "AbortError") return undefined
        const message = error instanceof Error ? error.message : "Unknown error"
        productsStore.setError(message)
        console.error("Failed to fetch products:", error)
        throw error
      } finally {
        inflightRef.current--
        if (inflightRef.current === 0) productsStore.setLoading(false)
      }
    },
    // productsStore actions are stable Zustand references — not needed in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  /**
   * Fetch a single product by ID
   */
  const fetchProductById = useCallback(
    async (id: string, branch?: string) => {
      inflightRef.current++
      try {
        productsStore.setLoading(true)
        productsStore.setError(null)

        const query = branch ? `?branch=${encodeURIComponent(branch)}` : ""
        const response = await fetch(`/api/customer/products/${id}${query}`)
        if (!response.ok) throw new Error("Failed to fetch product")

        const data = await response.json()
        const payload = data.data ?? data
        const product: Product = {
          ...payload,
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(payload.updatedAt),
        }

        productsStore.setCurrentProduct(product)
        return product
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        productsStore.setError(message)
        console.error("Failed to fetch product:", error)
        throw error
      } finally {
        inflightRef.current--
        if (inflightRef.current === 0) productsStore.setLoading(false)
      }
    },
    // productsStore actions are stable Zustand references — not needed in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  /**
   * Get product from store by ID
   */
  return {
    // State
    products: productsStore.products,
    currentProduct: productsStore.currentProduct,
    isLoading: productsStore.isLoading,
    error: productsStore.error,

    // Actions
    fetchProducts,
    fetchProductById,
  }
}
