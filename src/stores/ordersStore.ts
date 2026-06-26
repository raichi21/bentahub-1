import { create } from "zustand"

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
  createdAt: Date
}

export interface Order {
  id: string
  userId: string
  status: "pending" | "processing" | "ready" | "completed" | "cancelled"
  paymentMethod: "cash" | "gcash"
  totalAmount: number
  branch: string
  notes: string
  isPaid: boolean
  paidAt: Date | null
  pickupDeadline: Date | null
  items: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export interface OrdersState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null

  // Actions
  setOrders: (orders: Order[]) => void
  setCurrentOrder: (order: Order | null) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (order) => set({ currentOrder: order }),

  addOrder: (order) => {
    const { orders } = get()
    set({ orders: [order, ...orders] })
  },

  updateOrder: (id, updates) => {
    const { orders } = get()
    const updated = orders.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    )
    set({ orders: updated })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
