"use client"

import { useEffect, useRef } from "react"

/** Default background refresh interval (60s). */
export const POLL_INTERVAL_MS = 60_000

/**
 * Runs `callback` on an interval, skipping ticks while the tab is hidden
 * and refetching immediately when it becomes visible again. Pass `null` to
 * disable. Always invokes the latest callback (no stale closures).
 */
export function usePolling(
  callback: () => void,
  intervalMs: number | null
): void {
  const savedRef = useRef(callback)

  useEffect(() => {
    savedRef.current = callback
  }, [callback])

  useEffect(() => {
    if (intervalMs == null || intervalMs <= 0) return
    if (typeof document === "undefined") return
    const id = setInterval(() => {
      if (document.hidden) return
      savedRef.current()
    }, intervalMs)
    const onVisible = () => {
      if (!document.hidden) savedRef.current()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [intervalMs])
}
