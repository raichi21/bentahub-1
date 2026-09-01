// ── Product & Inventory ──────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  "Coffee",
  "Baking Ingredients",
  "Condiments",
  "Household & Laundry Supplies",
  "Sauces",
  "Canned Goods",
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"

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

export interface Product {
  id: string
  sku: string
  barcode: string
  name: string
  price: number
  category: ProductCategory
  stock: number
  reorderLevel: number
  image: string
  unit: string
  nearestExpiry: string | null
  activeBatchCount?: number
  batches?: InventoryBatchItem[]
}

// ── Cart ─────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
}

// ── Transactions ─────────────────────────────────────────────────────

export type TransactionStatus = "completed" | "cancelled" | "refunded"

export interface TransactionItem {
  productId: string
  name: string
  qty: number
  price: number
}

export interface Transaction {
  id: string
  receiptNumber: number
  date: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: "cash" | "gcash"
  amountPaid: number
  change: number
  cashier: string
  status: TransactionStatus
}

// ── Payments ─────────────────────────────────────────────────────────

export type PaymentStatus = "verified" | "pending" | "failed"

export interface Payment {
  id: string
  transactionId: string
  referenceNumber: string
  method: "cash" | "gcash"
  amount: number
  status: PaymentStatus
  date: string
  customerName?: string
}

// ── Cash Drawer ──────────────────────────────────────────────────────

export type CashDrawerStatus = "open" | "closed"

export interface CashDrawerSession {
  id: string
  branchId: string
  cashierId: string | null
  openedAt: string
  closedAt: string | null
  closedBy: string | null
  startingCash: string
  expectedEndingCash: string | null
  actualEndingCash: string | null
  notes: string | null
  status: CashDrawerStatus
  verifiedByAdminId: string | null
  verifiedAt: string | null
}

export function formatPeso(value: string | number | null | undefined): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return "₱0.00"
  return `₱${num.toFixed(2)}`
}
