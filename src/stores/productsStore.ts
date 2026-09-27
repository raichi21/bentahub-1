import { create } from "zustand"

export interface Product {
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
  barcode: string
  isActive: boolean
  nearestExpiry?: string | null
  /** Whether the product is sold by pack (e.g., per dozen) */
  sellByPack?: boolean
  /** Pack size for products sold in packs (e.g., 12 for dozen) */
  packSize?: number
  /** Pack price for display purposes */
  packPrice?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null

  // Actions
  setProducts: (products: Product[]) => void
  setCurrentProduct: (product: Product | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  currentProduct: null,
  // Default to loading: a cold-loaded catalog/detail page has no data yet and
  // must show a spinner instead of flashing "Not Found" or an empty grid.
  isLoading: true,
  error: null,

  setProducts: (products) => set({ products }),
  setCurrentProduct: (product) => set({ currentProduct: product }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateProduct: (id, updates) => {
    const { products } = get()
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
    set({ products: updated })
  },
}))
