import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useCartActions } from "./useCart"
import { useCartStore, type CartItem } from "@/stores/cartStore"

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { userId: "user-1" }, token: "test-token" }),
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
