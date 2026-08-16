/**
 * Cart limits and quantity/stock validation shared by the customer cart
 * and checkout API routes.
 */

/** Max quantity a single cart item can hold (matches the customer UI stepper). */
export const MAX_ITEM_QUANTITY = 99

/**
 * Clamp a requested quantity into the valid range [1, MAX_ITEM_QUANTITY].
 * Returns `null` when the input is not a usable number.
 */
export function clampCartQuantity(quantity: number): number | null {
  if (!Number.isFinite(quantity) || quantity < 1) return null
  return Math.min(Math.floor(quantity), MAX_ITEM_QUANTITY)
}

/**
 * Validate a (already clamped) quantity against the current branch stock.
 * `available` may be `null`/`undefined` when the branch could not be
 * resolved to inventory — in that case stock validation is skipped.
 * Returns an error message, or `null` when the quantity is acceptable.
 */
export function validateCartQuantity(quantity: number, available: number | null | undefined): string | null {
  if (available === null || available === undefined) return null
  if (available <= 0) {
    return "This product is out of stock at the selected branch"
  }
  if (quantity > available) {
    return `Only ${available} item(s) available at the selected branch`
  }
  return null
}
