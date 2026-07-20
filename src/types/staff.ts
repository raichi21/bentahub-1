export interface StaffDashboardKpis {
  totalProducts: number
  totalProductsSubtext: string
  lowStockCount: number
  pendingPickups: number
  todayRevenue: number
}

export interface StaffDashboardData {
  kpis: StaffDashboardKpis
}

export interface StaffProductItem {
  id: string
  sku: string
  name: string
  price: number
  category: string
  image: string | null
  stock: number
  reorderLevel: number
  stockStatus: "in-stock" | "low-stock" | "out-of-stock"
  nearestExpiry: string | null
}

export interface StaffProductsData {
  products: StaffProductItem[]
  summary: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
  }
}

export interface StaffTransactionItem {
  id: string
  date: string
  paymentMethod: "cash" | "gcash"
  total: number
  status: "completed" | "cancelled" | "pending"
}

export interface StaffApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}
