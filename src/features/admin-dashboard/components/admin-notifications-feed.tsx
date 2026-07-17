"use client"

import {
  AlertTriangle, Package, Bell, RefreshCw,
} from "lucide-react"
import { useAdminNotifications } from "@/hooks/useAdminNotifications"
import type { AdminNotificationItem } from "@/features/admin-dashboard/actions/get-admin-notifications"
import { KPICard } from "./kpi-card"

const iconElements: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
  RefreshCw: <RefreshCw className="w-5 h-5" />,
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
  Payment: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  Promotions: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
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
  } = useAdminNotifications()

  const criticalCount = notifications.filter((n) => n.severity === "critical" && !n.isRead).length
  const inventoryCount = notifications.filter((n) => n.category === "Inventory").length
  const activeNotifications = notifications.filter((n) => !n.isRead).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ))}
        </section>
        <section className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded mb-2" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Recent Activity
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-primary hover:underline transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n: AdminNotificationItem) => {
            const borderClass = borderColorMap[n.severity] || "border-l-border"
            const badgeClass = badgeColorMap[n.category] || "bg-gray-100 text-gray-700"
            const iconClass = iconColorMap[n.severity] || "text-muted-foreground"
            const iconEl = iconElements[n.icon] || <Bell className="w-5 h-5" />

            return (
              <div
                key={n.id}
                className={`group flex items-start gap-4 p-5 bg-card border-l-4 ${borderClass} border-y border-r border-border rounded-r-lg shadow-sm hover:bg-muted/30 transition-all ${!n.isRead ? "ring-1 ring-primary/5" : ""}`}
              >
                <div className={`flex-shrink-0 mt-0.5 ${iconClass}`}>
                  {iconEl}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className={`text-sm ${n.isRead ? "font-medium" : "font-bold"} text-foreground`}>
                        {n.title}
                      </h4>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                          {n.category}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">{n.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => markAsRead(n.id)}
                        className={`p-1.5 rounded-lg transition-colors ${!n.isRead ? "text-primary hover:bg-primary/10" : "text-muted-foreground/30 cursor-default"}`}
                        disabled={n.isRead}
                        title="Mark as read"
                      >
                        <Bell className="w-[18px] h-[18px]" />
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
