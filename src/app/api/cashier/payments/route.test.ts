import { describe, it, expect, vi, beforeEach } from "vitest"

// payments/route.ts opens a real Postgres client via @/servers/db at module
// load and hits PayMongo on the happy path — stub both.
const state = vi.hoisted(() => ({
  session: null as null | { id: string },
  insertValues: [] as unknown[],
}))

vi.mock("@/servers/db", () => {
  const stmt = (kind: "select" | "update" | "insert") => {
    const s = {} as Record<string, (...a: unknown[]) => unknown> & {
      then: (resolve: (v: unknown) => void) => void
    }
    for (const m of [
      "select",
      "update",
      "insert",
      "from",
      "where",
      "set",
      "values",
      "returning",
    ]) {
      s[m] = (...args: unknown[]) => {
        if (m === "values") state.insertValues.push(args[0])
        return s
      }
    }
    s.then = (resolve: (v: unknown) => void) => {
      if (kind === "select") resolve([{ maxReceipt: 5 }])
      else resolve([])
    }
    return s
  }
  return {
    db: {
      query: {
        users: {
          findFirst: async () => ({
            id: "cashier-1",
            branch: "Lourdes Main Branch",
            fullName: "Test Cashier",
            email: "cashier@test.local",
          }),
        },
        branches: {
          findFirst: async () => ({ id: "branch-1" }),
        },
        cashDrawerSessions: {
          findFirst: async () => state.session,
        },
      },
      select: () => stmt("select"),
      insert: () => stmt("insert"),
      update: () => stmt("update"),
    },
  }
})

vi.mock("@/lib/paymongo", () => ({
  createCheckoutSession: vi.fn(async () => ({
    checkoutUrl: "https://paymongo.test/checkout",
    paymentIntentId: "pi_test_1",
  })),
  retrievePaymentIntent: vi.fn(),
  isPaymentSuccessful: vi.fn(),
}))

import { POST } from "./route"
import { generateToken } from "@/lib/auth-utils"
import type { NextRequest } from "next/server"

function authedRequest(body: unknown): NextRequest {
  const token = generateToken({
    userId: "cashier-1",
    email: "cashier@test.local",
    fullName: "Test Cashier",
    role: "cashier",
  })
  return new Request("http://localhost/api/cashier/payments", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

const saleBody = {
  items: [
    { product: { id: "prod-1", name: "Item", price: 10 }, quantity: 1 },
  ],
  totalAmount: 10,
}

beforeEach(() => {
  state.session = null
  state.insertValues = []
})

describe("POST /api/cashier/payments drawer requirement", () => {
  it("rejects GCash initiation with 400 when no drawer is open", async () => {
    state.session = null

    const res = await POST(authedRequest(saleBody))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.message).toMatch(/cash drawer/i)
    // Nothing persisted without a session.
    expect(state.insertValues).toHaveLength(0)
  })

  it("links the open session on the GCash transaction", async () => {
    state.session = { id: "sess-1" }

    const res = await POST(authedRequest(saleBody))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // Two inserts fire: the transaction row and its items. The transaction
    // row is the one carrying paymentMethod + sessionId.
    const txnInsert = state.insertValues.find(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        "paymentMethod" in (v as Record<string, unknown>)
    )
    expect(txnInsert).toMatchObject({
      paymentMethod: "gcash",
      status: "pending",
      sessionId: "sess-1",
    })
  })
})
