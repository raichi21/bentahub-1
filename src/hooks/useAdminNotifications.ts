"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./useAuth"
import type { AdminNotificationItem } from "@/features/admin-dashboard/actions/get-admin-notifications"

const POLL_INTERVAL = 30000

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function useAdminNotifications() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    if (!token) return
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append("limit", "50")
      params.append("offset", "0")
      if (unreadOnly) params.append("unreadOnly", "true")

      const response = await fetch(`/api/admin/notifications?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(token),
      })

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
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [token, fetchNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ isRead: true }),
      })

      if (!response.ok) throw new Error("Failed to mark notification as read")

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }, [token])

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
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err)
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
  }
}
