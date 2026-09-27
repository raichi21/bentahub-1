import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { usePolling, POLL_INTERVAL_MS } from "./use-polling"

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    value: hidden,
    configurable: true,
  })
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setHidden(false)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("exposes a 60s default interval", () => {
    expect(POLL_INTERVAL_MS).toBe(60_000)
  })

  it("calls back on every interval tick", () => {
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 60_000))
    expect(cb).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(cb).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it("skips ticks while the tab is hidden and refetches on visible", () => {
    const cb = vi.fn()
    renderHook(() => usePolling(cb, 60_000))
    setHidden(true)
    act(() => {
      vi.advanceTimersByTime(180_000)
    })
    expect(cb).not.toHaveBeenCalled()
    act(() => {
      setHidden(false)
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it("creates no interval when disabled with null", () => {
    const cb = vi.fn()
    renderHook(() => usePolling(cb, null))
    act(() => {
      vi.advanceTimersByTime(300_000)
    })
    expect(cb).not.toHaveBeenCalled()
  })
})
