"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"

export function NotificationBadge() {
  const { token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/staff/notifications?unreadOnly=true&limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
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
    intervalRef.current = setInterval(fetchUnreadCount, 30000)

    const handleRefresh = () => fetchUnreadCount()
    window.addEventListener("notifications-read", handleRefresh)

    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener("notifications-read", handleRefresh)
    }
  }, [token, fetchUnreadCount])

  if (unreadCount === 0) return null

  return (
    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )
}
