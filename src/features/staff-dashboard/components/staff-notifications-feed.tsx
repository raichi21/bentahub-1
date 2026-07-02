"use client"

import { useState } from "react"
import {
  AlertTriangle, Package, Bell, RefreshCw, Filter,
} from "lucide-react"
import { useStaffNotifications } from "@/hooks/useStaffNotifications"

interface StaffNotificationItem {
  id: string
  title: string
  message: string
  type: string
  category: string
  severity: "critical" | "info" | "success" | "warning"
  timestamp: string
  createdAt: Date
  isRead: boolean
  icon: string
}

const iconElements: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle className="w-8 h-8" />,
  Package: <Package className="w-8 h-8" />,
  Bell: <Bell className="w-8 h-8" />,
  RefreshCw: <RefreshCw className="w-8 h-8" />,
}

const iconColors: Record<string, string> = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-primary",
  success: "text-green-600",
}

const iconBgColors: Record<string, string> = {
  critical: "bg-red-100 dark:bg-red-900/20",
  warning: "bg-amber-100 dark:bg-amber-900/20",
  info: "bg-primary/10",
  success: "bg-green-100 dark:bg-green-900/20",
}

const borderColors: Record<string, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-primary",
  success: "border-l-green-600",
}

const titleColors: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-amber-600",
  info: "text-primary",
  success: "text-green-600",
}

export function StaffNotificationsFeed() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useStaffNotifications()

  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showFilter, setShowFilter] = useState(false)

  const types = Array.from(new Set(notifications.map((n) => n.type)))
  const filtered = typeFilter === "all"
    ? notifications
    : notifications.filter((n) => n.type === typeFilter)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
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
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="bg-surface-container px-3 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 hover:bg-surface-container-higher transition-colors"
                aria-label="Filter notifications"
              >
                <Filter className="w-4 h-4" />
                {typeFilter === "all" ? "All" : typeFilter}
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px]">
                  <button
                    onClick={() => { setTypeFilter("all"); setShowFilter(false) }}
                    className={`block w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors ${typeFilter === "all" ? "text-primary" : "text-foreground"}`}
                  >
                    All
                  </button>
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setShowFilter(false) }}
                      className={`block w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors capitalize ${typeFilter === t ? "text-primary" : "text-foreground"}`}
                    >
                      {t.replace(/-/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-surface-container px-3 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:bg-surface-container-higher transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          filtered.map((n: StaffNotificationItem) => {
            const iconEl = iconElements[n.icon] || <Bell className="w-8 h-8" />
            const iconColor = iconColors[n.severity] || "text-muted-foreground"
            const iconBg = iconBgColors[n.severity] || "bg-surface-variant"
            const borderColor = borderColors[n.severity] || "border-l-border"
            const titleColor = titleColors[n.severity] || "text-foreground"

            return (
              <div
                key={n.id}
                className={`bg-card border-l-4 ${borderColor} border-y border-r border-border rounded-r-xl p-5 flex flex-col md:flex-row gap-4 items-start shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${!n.isRead ? "ring-1 ring-primary/5" : ""}`}
              >
                <div className="absolute top-2 right-3">
                  <span className="text-[11px] text-muted-foreground/60 font-mono">{n.timestamp}</span>
                </div>

                <div className={`${iconBg} ${iconColor} p-3 rounded-lg flex-shrink-0`}>
                  {iconEl}
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-bold ${titleColor}`}>{n.title}</h4>
                    {!n.isRead && (
                      <span className="bg-accent text-primary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-tighter">
                        New
                      </span>
                    )}
                  </div>

                  {n.message && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-variant text-muted-foreground">
                      {n.category}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
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
