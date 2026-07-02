// ── Product & Inventory ──────────────────────────────────────────────

export const PRODUCT_CATEGORIES = [
  "Groceries",
  "Beverages",
  "Household",
  "Pharmacy",
  "Snacks",
  "Bakery",
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
