/**
 * Normalize a scanned barcode value for comparison.
 * Strips whitespace and converts to uppercase.
 */
export function normalizeBarcode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * Check if a scanned code matches a product's barcode or SKU.
 * Supports exact match and partial match (code is a suffix of the stored value).
 */
export function matchBarcode(scannedCode: string, storedCode: string): boolean {
  const normalized = normalizeBarcode(scannedCode)
  const stored = normalizeBarcode(storedCode)
  if (stored === normalized) return true
  if (stored.endsWith(normalized)) return true
  return false
}

/**
 * Find a product by scanned barcode from a list of products.
 * Checks the `barcode` field first (exact match), then falls back to `sku`.
 * Returns the first matching product or undefined.
 */
export function findProductByBarcode<T extends { sku: string; barcode?: string }>(
  products: T[],
  scannedCode: string,
): T | undefined {
  // First: check dedicated barcode field (exact match only)
  const normalized = normalizeBarcode(scannedCode)
  const byBarcode = products.find(
    (p) => p.barcode && normalizeBarcode(p.barcode) === normalized,
  )
  if (byBarcode) return byBarcode

  // Fallback: match against SKU
  return products.find((p) => matchBarcode(scannedCode, p.sku))
}
