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

export type BatchStatus = "next-to-sell" | "normal" | "expiring" | "out"

export interface InventoryBatchItem {
  id: string
  batchNumber: string | null
  quantity: number
  originalQuantity: number
  expiryDate: string | null
  receivedDate: string
  supplier: string | null
  status: BatchStatus
}

export interface StaffProductItem {
  id: string
  sku: string
  barcode: string
  name: string
  price: number
  category: string
  image: string | null
  stock: number
  reorderLevel: number
  stockStatus: "in-stock" | "low-stock" | "out-of-stock"
  nearestExpiry: string | null
  activeBatchCount?: number
  batches?: InventoryBatchItem[]
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
  items: { productName: string; quantity: number; price: number; subtotal: number }[]
}

export interface StaffApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}
