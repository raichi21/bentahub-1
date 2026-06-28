import { useCallback, useEffect } from "react"
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

  /**
   * Fetch user's notifications from backend
   */
  const fetchNotifications = useCallback(
    async (unreadOnly: boolean = false) => {
      if (!user) return
      if (!token) return
      if (notificationsStore.isLoading) return

      try {
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
        const notifications: Notification[] = (payload.notifications ?? []).map((n: any) => ({
          ...n,
          readAt: n.readAt ? new Date(n.readAt) : null,
          createdAt: new Date(n.createdAt),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
        }))

        notificationsStore.setNotifications(notifications)
        return notifications
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        notificationsStore.setError(message)
        console.error("Failed to fetch notifications:", error)
        throw error
      } finally {
        notificationsStore.setLoading(false)
      }
    },
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
    [user, token]
  )

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      notificationsStore.markAllAsRead()
      // Optionally sync with backend if needed
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      throw error
    }
  }, [user])

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
  }
}
