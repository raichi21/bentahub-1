"use client"

import { AlertTriangle, Package, Bell, RefreshCw } from "lucide-react"
import { useAdminNotifications } from "@/hooks/useAdminNotifications"
import type { AdminNotificationItem } from "@/features/admin-dashboard/actions/get-admin-notifications"
import { KPICard } from "./kpi-card"

const iconElements: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  RefreshCw: <RefreshCw className="h-5 w-5" />,
}

const borderColorMap: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-primary",
  success: "border-l-green-600",
}

const badgeColorMap: Record<string, string> = {
  Inventory: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  Orders: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  Payment:
    "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  Promotions:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  System: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
}

const iconColorMap: Record<string, string> = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-primary",
  success: "text-green-600",
}

export function AdminNotificationsFeed() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useAdminNotifications()

  const criticalCount = notifications.filter(
    (n) => n.severity === "critical" && !n.isRead
  ).length
  const inventoryCount = notifications.filter(
    (n) => n.category === "Inventory"
  ).length
  const activeNotifications = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-32 rounded bg-muted" />
            </div>
          ))}
        </section>
        <section className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="mb-4 text-sm text-red-500">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard
          title="Critical Alerts"
          value={String(criticalCount)}
          trend={`${criticalCount} unread`}
          trendType={criticalCount > 0 ? "warning" : "up"}
          icon={AlertTriangle}
        />
        <KPICard
          title="Inventory Updates"
          value={String(inventoryCount)}
          trend={`${inventoryCount} total`}
          trendType="up"
          icon={Package}
        />
        <KPICard
          title="Active Notifications"
          value={String(activeNotifications)}
          trend={`${activeNotifications} unread`}
          trendType={activeNotifications > 0 ? "warning" : "up"}
          icon={Bell}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Recent Activity
          </h3>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold text-red-500 transition-all hover:underline"
              >
                Clear all
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-primary transition-all hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((n: AdminNotificationItem) => {
            const borderClass = borderColorMap[n.severity] || "border-l-border"
            const badgeClass =
              badgeColorMap[n.category] || "bg-gray-100 text-gray-700"
            const iconClass =
              iconColorMap[n.severity] || "text-muted-foreground"
            const iconEl = iconElements[n.icon] || <Bell className="h-5 w-5" />

            return (
              <div
                key={n.id}
                className={`group flex items-start gap-4 border-l-4 bg-card p-5 ${borderClass} rounded-r-lg border-y border-r border-border shadow-sm transition-all hover:bg-muted/30 ${!n.isRead ? "ring-1 ring-primary/5" : ""}`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${iconClass}`}>
                  {iconEl}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4
                        className={`text-sm ${n.isRead ? "font-medium" : "font-bold"} text-foreground`}
                      >
                        {n.title}
                      </h4>
                      {n.message && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {n.message}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}
                        >
                          {n.category}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => markAsRead(n.id)}
                        className={`rounded-lg p-1.5 transition-colors ${!n.isRead ? "text-primary hover:bg-primary/10" : "cursor-default text-muted-foreground/30"}`}
                        disabled={n.isRead}
                        title="Mark as read"
                      >
                        <Bell className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
