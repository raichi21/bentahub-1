import { create } from "zustand"

export interface CartItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  subtotal: number
  image: string
  category: string
  branch: string
  addedAt: Date
  updatedAt: Date
  /**
   * Max units the customer can hold at the cart's branch (from
   * branchInventory). `null` = unknown (no branch/inventory row) — the
   * server-side validation stays as the backstop in that case.
   */
  availableStock?: number | null
  /** Pack size for products sold in packs (e.g., 12 for dozen) */
  packSize?: number
  /** Whether the product is sold by pack (e.g., per dozen) */
  sellByPack?: boolean
}

export interface CartState {
  items: CartItem[]
  itemCount: number
  total: number
  isLoading: boolean
  error: string | null

  // Actions
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  updateItem: (id: string, updates: Partial<CartItem>) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  calculateTotals: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  total: 0,
  isLoading: false,
  error: null,

  setItems: (items) => {
    const coerced = items.map((item) => ({
      ...item,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    }))
    // Backstop: cart_items and branch_inventory are unique-keyed so a server
    // response should never contain the same product twice. If a duplicate
    // ever slips through (legacy data, a stale cache, a just-resolved race),
    // collapse it to a single row — latest updatedAt wins, ties break on the
    // larger quantity — so the cart can never render the product twice.
    const byProduct = new Map<string, CartItem>()
    for (const item of coerced) {
      const existing = byProduct.get(item.productId)
      if (!existing) {
        byProduct.set(item.productId, item)
        continue
      }
      const existingUpdated = new Date(existing.updatedAt).getTime()
      const incomingUpdated = new Date(item.updatedAt).getTime()
      const keep =
        incomingUpdated > existingUpdated ||
        (incomingUpdated === existingUpdated &&
          item.quantity > existing.quantity)
      if (keep) byProduct.set(item.productId, item)
    }
    set({ items: [...byProduct.values()] })
    get().calculateTotals()
  },

  addItem: (item) => {
    const { items } = get()
    const existingIndex = items.findIndex((i) => i.productId === item.productId)

    if (existingIndex >= 0) {
      // Replace the whole row with the authoritative item (from the server
      // or an optimistic temp). Keeps the server row id after reconcile.
      const updated = [...items]
      updated[existingIndex] = {
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        updatedAt: new Date(),
      }
      set({ items: updated })
    } else {
      set({
        items: [
          ...items,
          {
            ...item,
            price: Number(item.price),
            subtotal: Number(item.subtotal),
          },
        ],
      })
    }

    get().calculateTotals()
  },

  updateItem: (id, updates) => {
    const { items } = get()
    const updated = items.map((item) =>
      item.id === id
        ? {
            ...item,
            ...updates,
            subtotal:
              updates.subtotal ??
              (updates.quantity ?? item.quantity) *
                (updates.price ?? item.price),
            updatedAt: new Date(),
          }
        : item
    )
    set({ items: updated })
    get().calculateTotals()
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }))
    get().calculateTotals()
  },

  clearCart: () => {
    set({ items: [], itemCount: 0, total: 0 })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  calculateTotals: () => {
    const { items } = get()
    const itemCount = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0
    )
    const total = items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    set({ itemCount, total })
  },
}))
