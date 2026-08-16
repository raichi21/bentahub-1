import type { Product } from "@/types/cashier"
import { formatPHDate } from "@/lib/date"

export function getStockStatus(product: Product): "in-stock" | "low-stock" | "out-of-stock" {
  if (product.stock === 0) return "out-of-stock"
  if (product.stock <= product.reorderLevel) return "low-stock"
  return "in-stock"
}

/** Compute days until expiry from a nearestExpiry date string. Returns null if no expiry. */
export function getExpiryDays(nearestExpiry: string | null): number | null {
  if (!nearestExpiry) return null
  const diffMs = new Date(nearestExpiry).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Format an expiry date string for display (e.g. "Dec 31, 2026"). */
export function formatExpiryDate(nearestExpiry: string | null): string | null {
  if (!nearestExpiry) return null
  return formatPHDate(new Date(nearestExpiry), { month: "short", day: "numeric", year: "numeric" })
}

/** Check if a product's nearest expiry is within 30 days. */
export function isExpiringSoon(nearestExpiry: string | null): boolean {
  const days = getExpiryDays(nearestExpiry)
  return days !== null && days >= 0 && days <= 30
}
