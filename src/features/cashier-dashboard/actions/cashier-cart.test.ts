import { describe, it, expect, vi } from "vitest"

// cashier-cart.ts imports @/servers/db at module load, which opens a real
// Postgres client and throws without DATABASE_URL. These tests only exercise
// the pure decision/mapping helpers, so stub the db module.
vi.mock("@/servers/db", () => ({
  db: { transaction: vi.fn(), query: {} },
}))

import {
  resolveAddQuantity,
  resolveSetQuantity,
  computeCartTotals,
  mapToCashierProduct,
} from "./cashier-cart"
import type { Product } from "@/types/cashier"

function product(id: string, price: number): Product {
  return {
    id,
    sku: `SKU-${id}`,
    barcode: id,
    name: `Product ${id}`,
    price,
    category: "Coffee",
    stock: 100,
    reorderLevel: 10,
    image: "",
    unit: "pcs",
    nearestExpiry: null,
  }
}

describe("resolveAddQuantity", () => {
  it("adds one unit when stock is available", () => {
    expect(resolveAddQuantity(0, 5)).toEqual({ ok: true, quantity: 1 })
    expect(resolveAddQuantity(4, 5)).toEqual({ ok: true, quantity: 5 })
  })

  it("rejects when the product has no stock", () => {
    expect(resolveAddQuantity(0, 0)).toEqual({ ok: false })
    expect(resolveAddQuantity(0, -1)).toEqual({ ok: false })
  })

  it("rejects when the cart already holds every available unit", () => {
    expect(resolveAddQuantity(5, 5)).toEqual({ ok: false })
  })
})

describe("resolveSetQuantity", () => {
  it("sets exact quantity within stock", () => {
    expect(resolveSetQuantity(3, 10)).toEqual({ action: "set", quantity: 3 })
  })

  it("clamps quantity down to the available stock", () => {
    expect(resolveSetQuantity(15, 10)).toEqual({ action: "set", quantity: 10 })
  })

  it("removes the line for a non-positive quantity", () => {
    expect(resolveSetQuantity(0, 10)).toEqual({ action: "remove" })
    expect(resolveSetQuantity(-2, 10)).toEqual({ action: "remove" })
  })

  it("removes the line when the product is out of stock", () => {
    expect(resolveSetQuantity(2, 0)).toEqual({ action: "remove" })
    expect(resolveSetQuantity(2, -1)).toEqual({ action: "remove" })
  })

  it("rejects non-numeric quantities", () => {
    expect(resolveSetQuantity(Number.NaN, 10)).toEqual({ action: "reject" })
  })
})

describe("computeCartTotals", () => {
  it("sums item count and total with cent rounding", () => {
    const lines = [
      { product: product("a", 12.335), quantity: 2 },
      { product: product("b", 5.5), quantity: 1 },
    ]
    // 12.335 * 2 = 24.67 (rounded), + 5.5 = 30.17
    expect(computeCartTotals(lines)).toEqual({ itemCount: 3, total: 30.17 })
  })

  it("returns zeroes for an empty cart", () => {
    expect(computeCartTotals([])).toEqual({ itemCount: 0, total: 0 })
  })
})

describe("mapToCashierProduct", () => {
  const row = {
    id: "p1",
    sku: "SKU-1",
    barcode: "BAR-1",
    name: "Coffee",
    price: "12.50",
    category: "Coffee",
    image: null,
    unit: "pack",
    quantity: 99,
    sellByPack: true,
    packSize: 12,
    packPrice: "120.00",
  }

  it("maps product fields and branch stock", () => {
    const mapped = mapToCashierProduct(row, {
      quantity: 7,
      lowStockThreshold: 3,
    })
    expect(mapped.id).toBe("p1")
    expect(mapped.price).toBe(12.5)
    expect(mapped.stock).toBe(7)
    expect(mapped.reorderLevel).toBe(3)
    expect(mapped.sellByPack).toBe(true)
    expect(mapped.packSize).toBe(12)
    expect(mapped.packPrice).toBe(120)
    expect(mapped.nearestExpiry).toBeNull()
  })

  it("falls back to legacy product.quantity when no branch stock is passed", () => {
    const mapped = mapToCashierProduct(row)
    expect(mapped.stock).toBe(99)
    expect(mapped.reorderLevel).toBe(10)
    expect(mapped.packPrice).toBe(120)
  })
})
