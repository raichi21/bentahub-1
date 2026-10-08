"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./useAuth"
import { usePolling, POLL_INTERVAL_MS } from "./use-polling"
import { useNotificationsStream } from "./use-notifications-stream"
import type { AdminNotificationItem } from "@/features/admin-dashboard/actions/get-admin-notifications"

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function useAdminNotifications({
  pollInterval = POLL_INTERVAL_MS,
}: { pollInterval?: number } = {}) {
  const { token, user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(
    []
  )
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const fetchNotifications = useCallback(
    async (unreadOnly: boolean = false) => {
      if (!token) return
      if (isFetchingRef.current) return

      try {
        isFetchingRef.current = true
        setError(null)

        const params = new URLSearchParams()
        params.append("limit", "50")
        params.append("offset", "0")
        if (unreadOnly) params.append("unreadOnly", "true")

        const response = await fetch(
          `/api/admin/notifications?${params.toString()}`,
          {
            method: "GET",
            headers: authHeaders(token),
          }
        )

        if (!response.ok) throw new Error("Failed to fetch notifications")

        const json = await response.json()
        if (json.success && json.data) {
          setNotifications(json.data.notifications ?? [])
          setUnreadCount(json.data.unreadCount ?? 0)
        } else {
          throw new Error(json.message || "Failed to fetch notifications")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        console.error("Failed to fetch admin notifications:", err)
      } finally {
        isFetchingRef.current = false
        setInitialLoadComplete(true)
      }
    },
    [token]
  )

  const isLoading =
    token === undefined || (token !== null && !initialLoadComplete)

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => setInitialLoadComplete(true), 0)
      return () => {
        clearTimeout(timer)
        return
      }
    }

    const timer = setTimeout(() => fetchNotifications(), 0)

    return () => clearTimeout(timer)
  }, [token, fetchNotifications, pollInterval])

  // Primary update path: Supabase Realtime pushes the moment a notification
  // is inserted or its read state changes. The poll below is a safety net
  // (and stays disabled where callers pass pollInterval 0, e.g. topbar).
  useNotificationsStream(
    fetchNotifications,
    token ?? null,
    user?.userId ?? null
  )

  usePolling(fetchNotifications, token ? pollInterval : null)

  // Cross-instance sync (same pattern as staff): any mark/clear action
  // anywhere dispatches "notifications-read", so every hook consumer
  // (topbar badge, feed) refetches instantly without a page reload.
  useEffect(() => {
    const handleRefresh = () => fetchNotifications()
    window.addEventListener("notifications-read", handleRefresh)
    return () => {
      window.removeEventListener("notifications-read", handleRefresh)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!token) return

      try {
        const response = await fetch(
          `/api/admin/notifications/${notificationId}`,
          {
            method: "PATCH",
            headers: authHeaders(token),
            body: JSON.stringify({ isRead: true }),
          }
        )

        if (!response.ok) throw new Error("Failed to mark notification as read")

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        window.dispatchEvent(new CustomEvent("notifications-read"))
      } catch (err) {
        console.error("Failed to mark notification as read:", err)
      }
    },
    [token]
  )

  const markAllAsRead = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/notifications`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ markAll: true }),
      })

      if (!response.ok) throw new Error("Failed to mark all as read")

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      window.dispatchEvent(new CustomEvent("notifications-read"))
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
    }
  }, [token])

  const clearAll = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/notifications`, {
        method: "DELETE",
        headers: authHeaders(token),
      })

      if (!response.ok) throw new Error("Failed to clear notifications")

      setNotifications([])
      setUnreadCount(0)
      window.dispatchEvent(new CustomEvent("notifications-read"))
    } catch (err) {
      console.error("Failed to clear notifications:", err)
    }
  }, [token])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
}
