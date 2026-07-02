import type { Product } from "@/types/cashier"

export function getStockStatus(product: Product): "in-stock" | "low-stock" | "out-of-stock" {
  if (product.stock === 0) return "out-of-stock"
  if (product.stock <= product.reorderLevel) return "low-stock"
  return "in-stock"
}
