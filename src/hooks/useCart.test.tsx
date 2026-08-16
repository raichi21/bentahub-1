import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useCartActions, type CartItemSnapshot } from "./useCart"
import { useCartStore, type CartItem } from "@/stores/cartStore"

let mockAuth: { user: { userId: string } | null; token: string | null } = {
  user: { userId: "user-1" },
  token: "test-token",
}

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuth,
}))

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item-1",
    productId: "prod-1",
    productName: "Rice",
    price: 10,
    quantity: 1,
    subtotal: 10,
    image: "",
    category: "Grains",
    branch: "Main Branch",
    addedAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  }
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function okResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as unknown as Response
}

describe("useCartActions quantity sync", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockAuth = { user: { userId: "user-1" }, token: "test-token" }
    useCartStore.setState({ items: [], itemCount: 0, total: 0, isLoading: false, error: null })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("coalesces rapid edits into a single PUT carrying the final quantity", async () => {
    useCartStore.getState().setItems([makeItem()])
    const { result } = renderHook(() => useCartActions())

    const response = deferred<Response>()
    const fetchMock = vi.fn().mockImplementationOnce(() => response.promise)
    vi.stubGlobal("fetch", fetchMock)

    await act(async () => {
      result.current.updateCartItem("item-1", 3)
      result.current.updateCartItem("item-1", 4)
    })
    expect(useCartStore.getState().items[0].quantity).toBe(4)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ quantity: 4 })

    await act(async () => {
      response.resolve(okResponse({ data: { quantity: 4, subtotal: 40 } }))
    })
    expect(useCartStore.getState().items[0].quantity).toBe(4)
  })

  it("ignores a stale in-flight response so it can't overwrite a newer edit", async () => {
    useCartStore.getState().setItems([makeItem()])
    const { result } = renderHook(() => useCartActions())

    const stale = deferred<Response>()
    const fresh = deferred<Response>()
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => fresh.promise)
    vi.stubGlobal("fetch", fetchMock)

    // Edit 1: optimistic 1 -> 2, PUT dispatched after the debounce (captures version 1)
    await act(async () => {
      result.current.updateCartItem("item-1", 2)
    })
    expect(useCartStore.getState().items[0].quantity).toBe(2)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Edit 2 while edit 1's request is still in flight: 2 -> 5 (captures version 2)
    await act(async () => {
      result.current.updateCartItem("item-1", 5)
    })
    expect(useCartStore.getState().items[0].quantity).toBe(5)
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The newer response lands first and is adopted
    await act(async () => {
      fresh.resolve(okResponse({ data: { quantity: 5, subtotal: 50 } }))
    })
    expect(useCartStore.getState().items[0].quantity).toBe(5)
    expect(useCartStore.getState().items[0].subtotal).toBe(50)

    // The stale response lands last — it must NOT clobber the newer edit
    await act(async () => {
      stale.resolve(okResponse({ data: { quantity: 2, subtotal: 20 } }))
    })
    const after = useCartStore.getState().items[0]
    expect(after.quantity).toBe(5)
    expect(after.subtotal).toBe(50)
  })

  it("rolls back to the last server-confirmed values when the sync fails", async () => {
    useCartStore.getState().setItems([makeItem()])
    const { result } = renderHook(() => useCartActions())

    const response = deferred<Response>()
    const fetchMock = vi.fn().mockImplementationOnce(() => response.promise)
    vi.stubGlobal("fetch", fetchMock)

    await act(async () => {
      result.current.updateCartItem("item-1", 2)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      response.reject(new Error("network down"))
    })
    const after = useCartStore.getState().items[0]
    expect(after.quantity).toBe(1)
    expect(after.subtotal).toBe(10)
    expect(useCartStore.getState().error).toBe("network down")
  })

  it("does not roll back to a stale failed response once a newer edit owns the row", async () => {
    useCartStore.getState().setItems([makeItem()])
    const { result } = renderHook(() => useCartActions())

    const stale = deferred<Response>()
    const fresh = deferred<Response>()
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => fresh.promise)
    vi.stubGlobal("fetch", fetchMock)

    await act(async () => {
      result.current.updateCartItem("item-1", 2)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await act(async () => {
      result.current.updateCartItem("item-1", 5)
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    // The newer edit succeeds...
    await act(async () => {
      fresh.resolve(okResponse({ data: { quantity: 5, subtotal: 50 } }))
    })
    expect(useCartStore.getState().items[0].quantity).toBe(5)

    // ...and the stale request failing afterwards must not roll the row back
    await act(async () => {
      stale.reject(new Error("boom"))
    })
    const after = useCartStore.getState().items[0]
    expect(after.quantity).toBe(5)
    expect(after.subtotal).toBe(50)
  })
})

describe("useCartActions add / fetch merge / remove-during-add", () => {
  const snapshot: CartItemSnapshot = {
    productName: "Rice",
    price: 10,
    image: "",
    category: "Grains",
  }
  const serverData = {
    id: "server-1",
    productId: "prod-1",
    productName: "Rice",
    price: 10,
    quantity: 1,
    subtotal: 10,
    image: "",
    category: "Grains",
    branch: "Main Branch",
    addedAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mockAuth = { user: { userId: "user-1" }, token: "test-token" }
    useCartStore.setState({ items: [], itemCount: 0, total: 0, isLoading: false, error: null })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("rejects addToCart while the session is still loading (auth hydration)", async () => {
    mockAuth = { user: null, token: null }
    const { result } = renderHook(() => useCartActions())

    await expect(
      result.current.addToCart("prod-1", 1, "Main Branch", snapshot)
    ).rejects.toThrow("session is still loading")
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it("adds optimistically and reconciles with the server id", async () => {
    const { result } = renderHook(() => useCartActions())

    const addResponse = deferred<Response>()
    const fetchMock = vi.fn((_url: unknown, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      if (method === "POST") return addResponse.promise
      throw new Error(`unexpected ${method}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    await act(async () => {
      result.current.addToCart("prod-1", 1, "Main Branch", snapshot)
    })
    // Optimistic row is visible before the server round-trip completes
    let items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(1)

    await act(async () => {
      addResponse.resolve(okResponse({ data: serverData }))
    })
    items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe("server-1")
    expect(items[0].productId).toBe("prod-1")
    expect(useCartStore.getState().itemCount).toBe(1)
  })

  it("does not wipe a pending add when fetchCart lands a stale snapshot", async () => {
    const { result } = renderHook(() => useCartActions())

    const addResponse = deferred<Response>()
    const cartResponse = deferred<Response>()
    const fetchMock = vi.fn((_url: unknown, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      if (method === "POST") return addResponse.promise
      if (method === "GET") return cartResponse.promise
      throw new Error(`unexpected ${method}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    // Add starts; its POST is still in flight
    await act(async () => {
      result.current.addToCart("prod-1", 1, "Main Branch", snapshot)
    })
    expect(useCartStore.getState().items).toHaveLength(1)

    // A concurrent cart fetch returns an empty server cart (the add hadn't
    // landed on the server yet) — the optimistic row must survive
    const fetchPromise = result.current.fetchCart()
    await act(async () => {
      cartResponse.resolve(okResponse({ data: { items: [] } }))
      await fetchPromise
    })
    expect(useCartStore.getState().items).toHaveLength(1)

    // The add finally lands — the row adopts the real server id
    await act(async () => {
      addResponse.resolve(okResponse({ data: serverData }))
    })
    const after = useCartStore.getState().items
    expect(after).toHaveLength(1)
    expect(after[0].id).toBe("server-1")
  })

  it("removing while the add is in flight cleans up the server row and stays out of the store", async () => {
    const { result } = renderHook(() => useCartActions())

    const addResponse = deferred<Response>()
    const deleteResponse = deferred<Response>()
    const fetchMock = vi.fn((_url: unknown, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      if (method === "POST") return addResponse.promise
      if (method === "DELETE") return deleteResponse.promise
      throw new Error(`unexpected ${method}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    await act(async () => {
      result.current.addToCart("prod-1", 1, "Main Branch", snapshot)
    })
    const tempId = useCartStore.getState().items[0].id

    // User removes the row while the add POST is still in flight
    await act(async () => {
      result.current.removeFromCart(tempId)
    })
    expect(useCartStore.getState().items).toHaveLength(0)

    // The add lands — it must not resurrect the row; instead it issues a
    // silent DELETE for the server row
    await act(async () => {
      addResponse.resolve(okResponse({ data: serverData }))
    })
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customer/cart/server-1",
      expect.objectContaining({ method: "DELETE" })
    )
  })

  it("does not resurrect an item removed during a failed add", async () => {
    const { result } = renderHook(() => useCartActions())

    const addResponse = deferred<Response>()
    const fetchMock = vi.fn((_url: unknown, init?: RequestInit) => {
      const method = init?.method ?? "GET"
      if (method === "POST") return addResponse.promise
      throw new Error(`unexpected ${method}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    // Swallow the re-thrown error below so the test has no unhandled rejection
    const addPromise = result.current
      .addToCart("prod-1", 1, "Main Branch", snapshot)
      .catch(() => {})
    expect(useCartStore.getState().items).toHaveLength(1)
    const tempId = useCartStore.getState().items[0].id

    await act(async () => {
      result.current.removeFromCart(tempId)
    })
    expect(useCartStore.getState().items).toHaveLength(0)

    // The add fails AFTER the user removed the row — rollback must not
    // restore it
    await act(async () => {
      addResponse.reject(new Error("network down"))
      await addPromise
    })
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})
