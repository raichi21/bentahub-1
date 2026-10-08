import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useNotificationsStream } from "./use-notifications-stream"

interface MockChannel {
  topic: string
  table: string | null
  filter: string | null
  handler: (() => void) | null
  removed: boolean
  emit: () => void
}

interface MockClient {
  setAuthCalls: unknown[]
  channels: MockChannel[]
  realtime: { setAuth?: (jwt: string | null) => void }
  channel: (topic: string) => MockChannel
  removeChannel: (ch: MockChannel) => Promise<void>
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
      const channel: MockChannel = {
        topic,
        table: null,
        filter: null,
        handler: null,
        removed: false,
        emit: () => {
          channel.handler?.()
        },
      }
      const chainable = channel as MockChannel & {
        on: (
          type: string,
          params: { table?: string; filter?: string },
          cb: () => void
        ) => unknown
        subscribe: (cb: (status: string) => void) => unknown
      }
      chainable.on = (
        _type: string,
        params: { table?: string; filter?: string },
        cb: () => void
      ) => {
        channel.table = params.table ?? null
        channel.filter = params.filter ?? null
        channel.handler = cb
        return chainable
      }
      chainable.subscribe = () => chainable
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

describe("useNotificationsStream", () => {
  beforeEach(() => {
    mocks.client = makeClient()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("subscribes the notifications channel with per-user filter", () => {
    const cb = vi.fn()
    renderHook(() => useNotificationsStream(cb, "jwt-token", "staff-1"))

    const client = mocks.client as MockClient
    expect(client.channels).toHaveLength(1)
    expect(client.channels[0].topic).toBe("notifications:staff-1")
    expect(client.channels[0].table).toBe("notifications")
    expect(client.channels[0].filter).toBe("user_id=eq.staff-1")
    expect(client.setAuthCalls).toEqual(["jwt-token"])

    act(() => {
      client.channels[0].emit()
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("subscribes nothing when token or userId is null", () => {
    const cb = vi.fn()
    renderHook(() => useNotificationsStream(cb, null, "staff-1"))
    renderHook(() => useNotificationsStream(cb, "jwt-token", null))
    expect((mocks.client as MockClient).channels).toHaveLength(0)
    expect(cb).not.toHaveBeenCalled()
  })

  it("unsubscribes on unmount", () => {
    const cb = vi.fn()
    const { unmount } = renderHook(() =>
      useNotificationsStream(cb, "jwt-token", "staff-1")
    )

    const client = mocks.client as MockClient
    expect(client.channels).toHaveLength(1)

    unmount()
    expect(client.channels[0].removed).toBe(true)
  })
})
