import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a UUID order ID into a user-friendly display ID.
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" → "#TRN-A1B2C3"
 */
export function formatOrderId(id: string): string {
  const shortId = id.replace(/-/g, "").substring(0, 6).toUpperCase()
  return `#TRN-${shortId}`
}

/**
 * Format a UUID order ID into a short title.
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" → "Order #TRN-A1B2C3"
 */
export function formatOrderTitle(id: string): string {
  return `Order ${formatOrderId(id)}`
}
