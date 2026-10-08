"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { usePolling, POLL_INTERVAL_MS } from "@/hooks/use-polling"
import { useNotificationsStream } from "@/hooks/use-notifications-stream"

export function NotificationBadge() {
  const { token, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(
        "/api/staff/notifications?unreadOnly=true&limit=1",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const json = await res.json()
      if (json.success && typeof json.data?.unreadCount === "number") {
        setUnreadCount(json.data.unreadCount)
      }
    } catch {
      // silent
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    const timer = setTimeout(fetchUnreadCount, 0)

    const handleRefresh = () => fetchUnreadCount()
    window.addEventListener("notifications-read", handleRefresh)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("notifications-read", handleRefresh)
    }
  }, [token, fetchUnreadCount])

  // Shares the `notifications:<userId>` realtime channel with the feed hook
  // (Supabase multiplexes over one socket). Poll below is a safety net.
  useNotificationsStream(
    fetchUnreadCount,
    token ?? null,
    user?.userId ?? null
  )

  usePolling(fetchUnreadCount, token ? POLL_INTERVAL_MS : null)

  if (unreadCount === 0) return null

  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )
}
