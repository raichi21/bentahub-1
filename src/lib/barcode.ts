/**
 * Normalize a scanned barcode value for comparison.
 * Strips whitespace and converts to uppercase.
 */
export function normalizeBarcode(code: string): string {
  return (code || "").trim().toUpperCase()
}

/**
 * Check if a scanned code matches a product's barcode or SKU.
 * Supports exact match, leading-zero normalization (e.g. UPC-A vs EAN-13),
 * and suffix/prefix matching.
 */
export function matchBarcode(scannedCode: string, storedCode: string): boolean {
  const normalized = normalizeBarcode(scannedCode)
  const stored = normalizeBarcode(storedCode)
  if (!normalized || !stored) return false
  if (stored === normalized) return true

  // Handle leading zeroes difference (common in 12-digit UPC vs 13-digit EAN-13)
  const noZeroScanned = normalized.replace(/^0+/, "")
  const noZeroStored = stored.replace(/^0+/, "")
  if (noZeroScanned && noZeroScanned === noZeroStored) return true

  // Suffix matching (e.g. barcode printed with country prefix or scanner dropping suffix)
  if (stored.endsWith(normalized) || normalized.endsWith(stored)) return true

  return false
}

/**
 * Find a product by scanned barcode from a list of products.
 * Checks the `barcode` field first, then falls back to `sku`.
 * Returns the first matching product or undefined.
 */
export function findProductByBarcode<
  T extends { sku: string; barcode?: string },
>(products: T[], scannedCode: string): T | undefined {
  if (!scannedCode) return undefined

  // First: check dedicated barcode field
  const byBarcode = products.find(
    (p) => p.barcode && matchBarcode(scannedCode, p.barcode)
  )
  if (byBarcode) return byBarcode

  // Fallback: match against SKU
  return products.find((p) => p.sku && matchBarcode(scannedCode, p.sku))
}
