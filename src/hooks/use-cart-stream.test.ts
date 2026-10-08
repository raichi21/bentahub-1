import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useCartStream } from "./use-cart-stream"

interface MockChannel {
  topic: string
  filter: string | null
  handler: (() => void) | null
  statusCb: ((status: string) => void) | null
  removed: boolean
  emit: () => void
  fail: () => void
}

interface MockClient {
  setAuthCalls: unknown[]
  channels: MockChannel[]
  realtime: { setAuth?: (jwt: string | null) => void }
  channel: (topic: string) => MockChannel
  removeChannel: (ch: MockChannel) => Promise<void>
}

function makeChannel(topic: string): MockChannel {
  const channel: MockChannel = {
    topic,
    filter: null,
    handler: null,
    statusCb: null,
    removed: false,
    emit: () => {
      channel.handler?.()
    },
    fail: () => {
      channel.statusCb?.("CHANNEL_ERROR")
    },
  }
  return channel
}

function makeClient(): MockClient {
  const client: MockClient = {
    setAuthCalls: [],
    channels: [],
    realtime: {
      setAuth: (jwt: string | null) => {
        client.setAuthCalls.push(jwt)
      },
    },
    channel: (topic: string) => {
      const channel = makeChannel(topic)
      // Capture the .on().subscribe() chain the hook builds.
      const chainable = channel as MockChannel & {
        on: (
          type: string,
          params: { filter?: string },
          cb: () => void
        ) => unknown
        subscribe: (cb: (status: string) => void) => unknown
      }
      chainable.on = (
        _type: string,
        params: { filter?: string },
        cb: () => void
      ) => {
        channel.filter = params.filter ?? null
        channel.handler = cb
        return chainable
      }
      chainable.subscribe = (cb: (status: string) => void) => {
        channel.statusCb = cb
        return chainable
      }
      client.channels.push(channel)
      return chainable as unknown as MockChannel
    },
    removeChannel: (ch: MockChannel) => {
      ch.removed = true
      return Promise.resolve()
    },
  }
  return client
}

const mocks = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: null as any,
}))

vi.mock("@/lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => mocks.client,
}))

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  })
}

describe("useCartStream", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setHidden(false)
    mocks.client = makeClient()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("subscribes per-user topic with RLS filter and reloads on change", () => {
    const cb = vi.fn()
    renderHook(() => useCartStream(cb, "jwt-token", "user-1"))

    const client = mocks.client as MockClient
    expect(client.channels).toHaveLength(1)
    expect(client.channels[0].topic).toBe("cart:user-1")
    expect(client.channels[0].filter).toBe("user_id=eq.user-1")
    expect(client.setAuthCalls).toEqual(["jwt-token"])

    act(() => {
      client.channels[0].emit()
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("subscribes nothing when token or userId is null", () => {
    const cb = vi.fn()
    renderHook(() => useCartStream(cb, null, "user-1"))
    renderHook(() => useCartStream(cb, "jwt-token", null))
    expect((mocks.client as MockClient).channels).toHaveLength(0)
    expect(cb).not.toHaveBeenCalled()
  })

  it("is a no-op when Supabase env is missing", () => {
    mocks.client = null
    const cb = vi.fn()
    renderHook(() => useCartStream(cb, "jwt-token", "user-1"))
    expect(cb).not.toHaveBeenCalled()
  })

  it("resubscribes after a channel error", () => {
    const cb = vi.fn()
    renderHook(() => useCartStream(cb, "jwt-token", "user-1"))

    const client = mocks.client as MockClient
    expect(client.channels).toHaveLength(1)

    act(() => {
      client.channels[0].fail()
    })
    expect(client.channels[0].removed).toBe(true)

    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(client.channels).toHaveLength(2)
    expect(client.channels[1].topic).toBe("cart:user-1")
  })

  it("unsubscribes while hidden and reloads on visible", () => {
    const cb = vi.fn()
    renderHook(() => useCartStream(cb, "jwt-token", "user-1"))

    const client = mocks.client as MockClient
    expect(client.channels).toHaveLength(1)

    act(() => {
      setHidden(true)
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(client.channels[0].removed).toBe(true)

    act(() => {
      setHidden(false)
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(client.channels).toHaveLength(2)
    // Immediate reload on becoming visible.
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
