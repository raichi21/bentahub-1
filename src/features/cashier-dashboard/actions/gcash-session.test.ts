import { describe, it, expect, vi, beforeEach } from "vitest"

// finalize-transaction.ts opens a real Postgres client via @/servers/db at
// module load — stub it. Tests drive `completeGcashTransaction` through a
// programmable fake transaction object.
const state = vi.hoisted(() => ({
  setCalls: [] as unknown[],
  txn: null as null | {
    id: string
    cashierId: string
    branchId: string
    sessionId: string | null
    items: Array<{ productId: string; quantity: number }>
  },
  session: null as null | { id: string },
  flipped: [] as Array<{ id: string }>,
  updateResults: [] as unknown[][],
  selectResults: [] as unknown[][],
}))

vi.mock("@/servers/db", () => ({
  db: {
    transaction: async (
      cb: (tx: unknown) => Promise<unknown>
    ): Promise<unknown> => cb(makeTx()),
  },
}))

/**
 * Fake drizzle statement. `tx.update()` chains resolve from `updateResults`,
 * `tx.select()` chains from `selectResults` — call order within each kind is
 * deterministic, so queues stay aligned regardless of which path runs.
 */
function stmt(kind: "update" | "select"): unknown {
  const s = {} as Record<string, () => unknown> & {
    then: (resolve: (v: unknown) => void) => void
  }
  for (const m of [
    "select",
    "update",
    "insert",
    "delete",
    "from",
    "where",
    "limit",
    "orderBy",
    "set",
    "values",
    "returning",
  ]) {
    s[m] = (...args: unknown[]) => {
      if (m === "set") state.setCalls.push(args[0])
      return s
    }
  }
  s.then = (resolve: (v: unknown) => void) => {
    const queue =
      kind === "update" ? state.updateResults : state.selectResults
    resolve(queue.shift() ?? [])
  }
  return s
}

function makeTx(): unknown {
  return {
    update: () => stmt("update"),
    select: () => stmt("select"),
    query: {
      transactions: {
        findFirst: async () => state.txn,
      },
      cashDrawerSessions: {
        findFirst: async () => state.session,
      },
    },
  }
}

import { completeGcashTransaction } from "./finalize-transaction"

const baseTxn = {
  id: "txn-1",
  cashierId: "cashier-1",
  branchId: "branch-1",
  sessionId: null as string | null,
  items: [{ productId: "prod-1", quantity: 2 }],
}

function stockSelects() {
  // deductStockIn: inv barrel, ensureDefaultBatch check, batch ledger.
  return [
    [{ id: "inv-1", quantity: 100 }],
    [{ id: "batch-0" }],
    [{ id: "batch-1", quantity: 50, expiryDate: null }],
  ]
}

beforeEach(() => {
  state.setCalls = []
  state.txn = null
  state.session = null
  state.flipped = []
  state.updateResults = []
  state.selectResults = []
})

describe("completeGcashTransaction session linkage", () => {
  it("attaches the open session when sessionId is NULL", async () => {
    state.flipped = [{ id: "txn-1" }]
    state.txn = { ...baseTxn, sessionId: null }
    state.session = { id: "sess-1" }
    // Updates: status flip, session attach, batch + barrel deductions.
    state.updateResults = [[...state.flipped], [], [], []]
    state.selectResults = stockSelects()

    const result = await completeGcashTransaction("txn-1")

    expect(result).toEqual({ completed: true, deducted: true })
    expect(state.setCalls).toContainEqual({ sessionId: "sess-1" })
  })

  it("leaves an existing sessionId untouched", async () => {
    state.flipped = [{ id: "txn-1" }]
    state.txn = { ...baseTxn, sessionId: "sess-old" }
    state.session = { id: "sess-1" }
    // Updates: status flip, batch + barrel deductions (no attach).
    state.updateResults = [[...state.flipped], [], []]
    state.selectResults = stockSelects()

    const result = await completeGcashTransaction("txn-1")

    expect(result).toEqual({ completed: true, deducted: true })
    expect(state.setCalls).not.toContainEqual({ sessionId: "sess-1" })
    expect(state.setCalls).not.toContainEqual(
      expect.objectContaining({ sessionId: expect.anything() })
    )
  })

  it("completes without attaching when no session is open", async () => {
    state.flipped = [{ id: "txn-1" }]
    state.txn = { ...baseTxn, sessionId: null }
    state.session = null
    state.updateResults = [[...state.flipped], [], []]
    state.selectResults = stockSelects()

    const result = await completeGcashTransaction("txn-1")

    expect(result).toEqual({ completed: true, deducted: true })
    expect(state.setCalls).not.toContainEqual(
      expect.objectContaining({ sessionId: expect.anything() })
    )
  })
})
