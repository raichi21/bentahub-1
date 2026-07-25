import { useCallback } from "react"
import { useProductsStore, type Product } from "@/stores/productsStore"

export function useProducts() {
  const productsStore = useProductsStore()

  /**
   * Fetch all products from backend
   * Supports optional filters: category, branch
   */
  const fetchProducts = useCallback(
    async (filters?: { category?: string; branch?: string }) => {
      try {
        productsStore.setLoading(true)
        productsStore.setError(null)

        const params = new URLSearchParams()
        if (filters?.category) params.append("category", filters.category)
        if (filters?.branch) params.append("branch", filters.branch)

        const query = params.toString()
        const url = `/api/customer/products${query ? `?${query}` : ""}`

        const response = await fetch(url)
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
        const message = error instanceof Error ? error.message : "Unknown error"
        productsStore.setError(message)
        console.error("Failed to fetch products:", error)
        throw error
      } finally {
        productsStore.setLoading(false)
      }
    },
    []
  )

  /**
   * Fetch a single product by ID
   */
  const fetchProductById = useCallback(
    async (id: string) => {
      if (productsStore.isLoading) return
      try {
        productsStore.setLoading(true)
        productsStore.setError(null)

        const response = await fetch(`/api/customer/products/${id}`)
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
        productsStore.setLoading(false)
      }
    },
    []
  )

  /**
   * Get product from store by ID
   */
  const getProductById = useCallback(
    (id: string) => {
      return productsStore.getProductById(id)
    },
    []
  )

  return {
    // State
    products: productsStore.products,
    currentProduct: productsStore.currentProduct,
    isLoading: productsStore.isLoading,
    error: productsStore.error,

    // Actions
    fetchProducts,
    fetchProductById,
    getProductById,
  }
}
