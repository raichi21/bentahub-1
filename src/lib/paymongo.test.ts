import { describe, it, expect } from "vitest"
import {
  toCheckoutLineItems,
  isPaymentSuccessful,
  isPaymentPending,
} from "./paymongo"

describe("toCheckoutLineItems", () => {
  it("charges per-unit price, not subtotal, so PayMongo amounts are correct", () => {
    const items = toCheckoutLineItems([
      { productName: "Rice 5kg", price: "245", quantity: 3 },
      { productName: "Eggs (tray)", price: 180, quantity: 1 },
    ])

    expect(items).toEqual([
      { name: "Rice 5kg", amount: 24500, quantity: 3 },
      { name: "Eggs (tray)", amount: 18000, quantity: 1 },
    ])
  })

  it("preserves fractional prices as centavos", () => {
    const items = toCheckoutLineItems([
      { productName: "Snack", price: "12.5", quantity: 4 },
    ])

    expect(items).toEqual([{ name: "Snack", amount: 1250, quantity: 4 }])
  })

  it("rounds per-unit price, never multiplies by quantity", () => {
    const items = toCheckoutLineItems([
      { productName: "Bulk", price: "0.5649", quantity: 2 },
    ])

    // Math.round(0.5649 * 100) = 56 centavos for ONE unit — quantity stays
    // separate so PayMongo bills amount × quantity (56 × 2).
    expect(items[0].amount).toBe(56)
    expect(items[0].quantity).toBe(2)
  })
})

describe("isPaymentSuccessful", () => {
  it("only accepts the final succeeded status", () => {
    expect(isPaymentSuccessful("succeeded")).toBe(true)
    expect(isPaymentSuccessful("paid")).toBe(false)
    expect(isPaymentSuccessful("processing")).toBe(false)
    expect(isPaymentSuccessful("awaiting_payment_method")).toBe(false)
    expect(isPaymentSuccessful("failed")).toBe(false)
  })
})

describe("isPaymentPending", () => {
  it("treats mid-flight statuses as pending, not final", () => {
    expect(isPaymentPending("awaiting_payment_method")).toBe(true)
    expect(isPaymentPending("awaiting_next_action")).toBe(true)
    expect(isPaymentPending("processing")).toBe(true)
    expect(isPaymentPending("succeeded")).toBe(false)
    expect(isPaymentPending("failed")).toBe(false)
  })
})
