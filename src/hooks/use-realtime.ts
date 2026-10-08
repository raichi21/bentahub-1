"use client"

import { useEffect, useRef } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

/** Delay before re-subscribing after a channel error (fallback poll covers the gap). */
const RESUBSCRIBE_MS = 5_000

export interface RealtimeSubscription {
  /** Per-owner topic, e.g. `cart:<userId>` — isolates payloads per owner. */
  topic: string
  /** Table in the `public` schema, must be in the `supabase_realtime` publication. */
  table: string
  /** Postgres Changes filter, e.g. `user_id=eq.<userId>`. */
  filter: string
}

/**
 * Shared Supabase Realtime (Postgres Changes) subscription. Invokes `callback`
 * on every INSERT/UPDATE/DELETE matching `filter`. Pass `null` to disconnect.
 *
 * The client connects DIRECTLY to Supabase over websocket — no Vercel
 * function is held open, so this costs zero function invocations and works
 * across all serverless instances. Authorization is enforced by RLS policies
 * that read the `userId` claim of our custom JWT (set via `realtime.setAuth`).
 *
 * Always invokes the latest callback (no stale closures). Unsubscribes while
 * the tab is hidden and resubscribes (with an immediate reload) when it
 * becomes visible again. If Supabase env is missing, this is a no-op and the
 * caller's fallback poll keeps data fresh.
 */
export function useRealtimeTable(
  callback: () => void,
  token: string | null,
  subscription: RealtimeSubscription | null
): void {
  const savedRef = useRef(callback)

  useEffect(() => {
    savedRef.current = callback
  }, [callback])

  const subKey = subscription
    ? `${subscription.topic}|${subscription.table}|${subscription.filter}`
    : null

  useEffect(() => {
    if (!token || !subKey) return
    if (typeof document === "undefined") return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    // Re-split: subKey is only a stable string for the dep array.
    const [topic, table, filter] = subKey.split("|")

    let channel: ReturnType<typeof supabase.channel> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false

    const onEvent = () => {
      savedRef.current()
    }

    const cleanupChannel = () => {
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      if (channel) {
        const toRemove = channel
        channel = null
        void supabase.removeChannel(toRemove).catch(() => {
          // Ignore — teardown must never throw.
        })
      }
    }

    const subscribe = () => {
      if (closed || document.hidden) return
      cleanupChannel()
      // Authorize the realtime socket with our custom JWT. RLS policies read
      // its `userId` claim. If setAuth is unavailable, the anon key still
      // applies and RLS fails closed (no rows delivered).
      const realtime = supabase.realtime as unknown as {
        setAuth?: (jwt: string | null) => void
      }
      realtime.setAuth?.(token)
      const next = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter },
          onEvent
        )
        .subscribe((status) => {
          if (closed) return
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            cleanupChannel()
            if (!document.hidden) {
              retryTimer = setTimeout(subscribe, RESUBSCRIBE_MS)
            }
          }
        })
      channel = next
    }

    const onVisible = () => {
      if (document.hidden) {
        cleanupChannel()
      } else {
        // Resubscribe and reload immediately — something may have changed
        // while the tab was hidden.
        subscribe()
        savedRef.current()
      }
    }

    subscribe()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      closed = true
      document.removeEventListener("visibilitychange", onVisible)
      cleanupChannel()
    }
    // Deps are the stable string key + token by design (see subKey above).
  }, [token, subKey])
}
