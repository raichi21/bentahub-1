import { create } from "zustand"

export interface Notification {
  id: string
  userId: string
  type:
    | "order-status"
    | "order-ready"
    | "order-completed"
    | "payment-received"
    | "low-stock"
    | "new-product"
    | "promotion"
    | "system"
  title: string
  message: string
  relatedOrderId?: string
  relatedProductId?: string
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  expiresAt: Date | null
}

export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null

  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  calculateUnreadCount: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setNotifications: (notifications) => {
    set({ notifications })
    get().calculateUnreadCount()
  },

  addNotification: (notification) => {
    const { notifications } = get()
    set({ notifications: [notification, ...notifications] })
    get().calculateUnreadCount()
  },

  markAsRead: (id) => {
    const { notifications } = get()
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, readAt: new Date() } : n
    )
    set({ notifications: updated })
    get().calculateUnreadCount()
  },

  markAllAsRead: () => {
    const { notifications } = get()
    const updated = notifications.map((n) => ({
      ...n,
      isRead: true,
      readAt: new Date(),
    }))
    set({ notifications: updated })
    get().calculateUnreadCount()
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
    get().calculateUnreadCount()
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  calculateUnreadCount: () => {
    const { notifications } = get()
    const unreadCount = notifications.filter((n) => !n.isRead).length
    set({ unreadCount })
  },
}))
