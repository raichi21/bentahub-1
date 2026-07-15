import { useCallback, useEffect, useRef } from "react"
import { useNotificationsStore, type Notification } from "@/stores/notificationsStore"
import { useAuth } from "./useAuth"

const POLL_INTERVAL = 30000 // 30 seconds

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function useNotifications() {
  const { user, token } = useAuth()
  const notificationsStore = useNotificationsStore()
  const isFetchingRef = useRef(false)

  /**
   * Fetch user's notifications from backend
   */
  const fetchNotifications = useCallback(
    async (unreadOnly: boolean = false) => {
      if (!user) return
      if (!token) return
      if (isFetchingRef.current) return

      try {
        isFetchingRef.current = true
        notificationsStore.setLoading(true)
        notificationsStore.setError(null)

        const params = new URLSearchParams()
        params.append("limit", "50")
        params.append("offset", "0")
        if (unreadOnly) params.append("unreadOnly", "true")

        const response = await fetch(
          `/api/customer/notifications?${params.toString()}`,
          {
            method: "GET",
            headers: authHeaders(token),
          }
        )
        if (!response.ok) throw new Error("Failed to fetch notifications")

        const data = await response.json()
        const payload = data.data ?? {}
        const notifications: Notification[] = (payload.notifications ?? []).map((n: Record<string, unknown>) => ({
          ...n,
          readAt: n.readAt ? new Date(n.readAt as string) : null,
          createdAt: new Date(n.createdAt as string),
          expiresAt: n.expiresAt ? new Date(n.expiresAt as string) : null,
        })) as Notification[]

        notificationsStore.setNotifications(notifications)
        return notifications
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        notificationsStore.setError(message)
        console.error("Failed to fetch notifications:", error)
        throw error
      } finally {
        isFetchingRef.current = false
        notificationsStore.setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token]
  )

  // Poll for new notifications every 30s
  useEffect(() => {
    if (!user || !token) return

    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [user, token, fetchNotifications])

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return
      if (!token) return

      try {
        const response = await fetch(
          `/api/customer/notifications/${notificationId}`,
          {
            method: "PATCH",
            headers: authHeaders(token),
            body: JSON.stringify({ isRead: true }),
          }
        )

        if (!response.ok) throw new Error("Failed to mark notification as read")

        notificationsStore.markAsRead(notificationId)
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
        throw error
      }
    },
    [user, token, notificationsStore]
  )

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return
    if (!token) return

    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ isRead: true }),
      })

      if (!response.ok) throw new Error("Failed to mark all notifications as read")

      notificationsStore.markAllAsRead()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      throw error
    }
  }, [user, token, notificationsStore])

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    if (!user) return
    if (!token) return

    try {
      const response = await fetch("/api/customer/notifications", {
        method: "DELETE",
        headers: authHeaders(token),
      })

      if (!response.ok) throw new Error("Failed to clear notifications")

      notificationsStore.setNotifications([])
    } catch (error) {
      console.error("Failed to clear notifications:", error)
      throw error
    }
  }, [user, token, notificationsStore])

  return {
    // State
    notifications: notificationsStore.notifications,
    unreadCount: notificationsStore.unreadCount,
    isLoading: notificationsStore.isLoading,
    error: notificationsStore.error,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
}
