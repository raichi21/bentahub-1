import { describe, it, expect } from "vitest"
import { MAX_ITEM_QUANTITY, clampCartQuantity, validateCartQuantity } from "./cart"

describe("clampCartQuantity", () => {
  it("returns null for non-finite or non-positive inputs", () => {
    expect(clampCartQuantity(0)).toBeNull()
    expect(clampCartQuantity(-5)).toBeNull()
    expect(clampCartQuantity(Number.NaN)).toBeNull()
    expect(clampCartQuantity(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it("floors fractional quantities", () => {
    expect(clampCartQuantity(1.9)).toBe(1)
    expect(clampCartQuantity(3.2)).toBe(3)
  })

  it("passes through valid quantities in range", () => {
    expect(clampCartQuantity(1)).toBe(1)
    expect(clampCartQuantity(50)).toBe(50)
    expect(clampCartQuantity(MAX_ITEM_QUANTITY)).toBe(MAX_ITEM_QUANTITY)
  })

  it("caps quantities above the max", () => {
    expect(clampCartQuantity(100)).toBe(MAX_ITEM_QUANTITY)
    expect(clampCartQuantity(5000)).toBe(MAX_ITEM_QUANTITY)
  })
})

describe("validateCartQuantity", () => {
  it("skips validation when stock is unknown", () => {
    expect(validateCartQuantity(10, null)).toBeNull()
    expect(validateCartQuantity(10, undefined)).toBeNull()
  })

  it("rejects when the product is out of stock", () => {
    expect(validateCartQuantity(1, 0)).toBe("This product is out of stock at the selected branch")
  })

  it("rejects quantities above available stock", () => {
    expect(validateCartQuantity(5, 3)).toBe("Only 3 item(s) available at the selected branch")
  })

  it("accepts quantities at or below available stock", () => {
    expect(validateCartQuantity(3, 3)).toBeNull()
    expect(validateCartQuantity(2, 3)).toBeNull()
  })
})
