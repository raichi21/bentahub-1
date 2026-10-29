import { describe, it, expect, vi } from "vitest"

// finalize-transaction.ts imports @/servers/db at module load, which opens a
// real Postgres client and throws without DATABASE_URL. None of these tests
// touch the DB — only the pure allocator + error type — so stub the db module.
vi.mock("@/servers/db", () => ({
  db: { transaction: vi.fn() },
}))

import { sql, type SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { inventoryBatches } from "@/drizzle/schema"
import {
  allocateBatches,
  buildIdCase,
  InsufficientStockError,
} from "./finalize-transaction"

const future = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000)
const past = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

describe("allocateBatches", () => {
  it("allocates fully across multiple batches FIFO order", () => {
    const result = allocateBatches(
      [
        { id: "b1", quantity: 2, expiryDate: null },
        { id: "b2", quantity: 5, expiryDate: null },
      ],
      4
    )

    expect(result.remaining).toBe(0)
    expect(result.allocations).toEqual([
      { batchId: "b1", quantity: 2 },
      { batchId: "b2", quantity: 2 },
    ])
  })

  it("skips expired batches and allocates from the remaining ones", () => {
    const result = allocateBatches(
      [
        { id: "expired", quantity: 10, expiryDate: past(1) },
        { id: "fresh", quantity: 3, expiryDate: future(10) },
      ],
      2
    )

    expect(result.remaining).toBe(0)
    expect(result.allocations).toEqual([{ batchId: "fresh", quantity: 2 }])
  })

  it("reports the shortfall when batches cannot cover the request", () => {
    const result = allocateBatches(
      [{ id: "b1", quantity: 1, expiryDate: null }],
      5
    )

    expect(result.remaining).toBe(4)
    expect(result.allocations).toEqual([{ batchId: "b1", quantity: 1 }])
  })

  it("leaves everything untouched when every batch is expired", () => {
    const result = allocateBatches(
      [{ id: "expired", quantity: 10, expiryDate: past(1) }],
      3
    )

    expect(result.remaining).toBe(3)
    expect(result.allocations).toEqual([])
  })

  it("handles zero requested quantity", () => {
    const result = allocateBatches(
      [{ id: "b1", quantity: 5, expiryDate: null }],
      0
    )

    expect(result.remaining).toBe(0)
    expect(result.allocations).toEqual([])
  })
})

describe("buildIdCase", () => {
  const toQuery = (values: Map<string, SQL>) =>
    new PgDialect().sqlToQuery(
      buildIdCase(inventoryBatches.id, inventoryBatches.quantity, values)
    )

  it("uses the id column as the CASE base expression", () => {
    const { sql: text } = toQuery(
      new Map([["batch-1", sql`${inventoryBatches.quantity} - 1`]])
    )

    // Regression: `CASE WHEN <id>` makes the id a boolean condition that
    // always evaluates false, so every row silently keeps its old quantity.
    expect(text).toMatch(/CASE\s+"inventory_batches"\."id"\s+WHEN/)
    expect(text).not.toMatch(/CASE\s+WHEN/)
  })

  it("emits one WHEN branch per id and keeps the column in ELSE", () => {
    const { sql: text, params } = toQuery(
      new Map([
        ["batch-1", sql`${inventoryBatches.quantity} - 1`],
        ["batch-2", sql`${inventoryBatches.quantity} - 2`],
      ])
    )

    expect(text.match(/WHEN/g)).toHaveLength(2)
    expect(text).toMatch(/ELSE "inventory_batches"\."quantity" END$/)
    expect(params).toContain("batch-1")
    expect(params).toContain("batch-2")
  })
})

describe("InsufficientStockError", () => {
  it("carries the product id, requested and available amounts", () => {
    const error = new InsufficientStockError("prod-1", 10, 4)

    expect(error.name).toBe("InsufficientStockError")
    expect(error.message).toContain("prod-1")
    expect(error.message).toContain("10")
    expect(error.message).toContain("4")
  })
})
