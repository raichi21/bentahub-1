/**
 * Normalize a scanned barcode value for comparison with stored SKUs.
 * Strips whitespace and converts to uppercase.
 */
export function normalizeBarcode(code: string): string {
  return code.trim().toUpperCase()
}

/**
 * Check if a scanned code matches a product SKU.
 * Supports exact match and partial match (code is a suffix of SKU).
 */
export function matchSku(scannedCode: string, productSku: string): boolean {
  const normalized = normalizeBarcode(scannedCode)
  const sku = normalizeBarcode(productSku)
  if (sku === normalized) return true
  if (sku.endsWith(normalized)) return true
  return false
}

/**
 * Find a product by scanned barcode from a list of products.
 * Returns the first matching product or undefined.
 */
export function findProductByBarcode<T extends { sku: string }>(
  products: T[],
  scannedCode: string,
): T | undefined {
  return products.find((p) => matchSku(scannedCode, p.sku))
}
