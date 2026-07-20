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

export interface Product {
  id: string
  sku: string
  name: string
  price: number
  category: ProductCategory
  stock: number
  reorderLevel: number
  image: string
  unit: string
  nearestExpiry: string | null
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
