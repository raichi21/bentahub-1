"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle,
  Wallet,
  AlertTriangle,
  Bell,
  Percent,
  Loader2,
  Inbox,
  Trash2,
} from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

type FilterTab = "all" | "orders" | "payments"

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
]

function getDisplayType(type: string): "order" | "payment" | "offer" | "alert" {
  if (type.startsWith("order")) return "order"
  if (type === "payment-received") return "payment"
  if (type === "promotion") return "offer"
  return "alert"
}

function getNotificationIcon(type: string) {
  if (type.startsWith("order")) return <CheckCircle className="h-5 w-5" />
  if (type === "payment-received") return <Wallet className="h-5 w-5" />
  if (type === "promotion") return <Percent className="h-5 w-5" />
  return <AlertTriangle className="h-5 w-5" />
}

function getNotificationStyle(type: string) {
  const dt = getDisplayType(type)
  switch (dt) {
    case "order":
      return {
        iconBg: "bg-green-50 dark:bg-green-900/20",
        iconColor: "text-green-600 dark:text-green-400",
        borderColor: "border-l-green-500",
      }
    case "payment":
      return {
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        borderColor: "border-l-primary",
      }
    case "offer":
      return {
        iconBg: "bg-purple-50 dark:bg-purple-900/20",
        iconColor: "text-purple-600 dark:text-purple-400",
        borderColor: "",
      }
    default:
      return {
        iconBg: "bg-red-50 dark:bg-red-900/20",
        iconColor: "text-red-600 dark:text-red-400",
        borderColor: "",
      }
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function CustomerNotificationsFeed() {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    clearAll,
  } = useNotifications()
  const [activeTab, setActiveTab] = useState<FilterTab>("all")

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const displayNotifications = useMemo(
    () =>
      notifications.map((n) => {
        const style = getNotificationStyle(n.type)
        return {
          id: n.id,
          title: n.title,
          description: n.message,
          type: getDisplayType(n.type),
          isRead: n.isRead,
          icon: getNotificationIcon(n.type),
          iconBg: style.iconBg,
          iconColor: style.iconColor,
          borderColor: style.borderColor,
          timestamp: formatTimestamp(n.createdAt),
          span:
            getDisplayType(n.type) === "offer"
              ? "md:col-span-3"
              : "md:col-span-2",
          layout:
            getDisplayType(n.type) === "offer"
              ? "featured"
              : ("default" as const),
        }
      }),
    [notifications]
  )

  const filtered =
    activeTab === "all"
      ? displayNotifications
      : displayNotifications.filter((n) => {
          if (activeTab === "orders") return n.type === "order"
          if (activeTab === "payments") return n.type === "payment"
          return true
        })

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors"
                  : "rounded-full bg-muted px-4 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted/70"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex cursor-pointer items-center gap-1 text-red-500 hover:text-red-600 hover:underline"
            >
              <Trash2 className="h-[18px] w-[18px]" />
              <span className="text-xs font-bold">Clear all</span>
            </button>
          )}
          <button
            onClick={markAllAsRead}
            className="flex cursor-pointer items-center gap-1 text-primary hover:underline"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="text-xs font-bold">Mark all as read</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
        {isLoading ? (
          <div className="col-span-6 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-6 flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              No notifications yet
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const isAlert = n.type === "alert"

            if (n.layout === "featured") {
              return (
                <div
                  key={n.id}
                  className={`${n.span} group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg`}
                >
                  <div className="absolute right-0 bottom-0 h-32 w-32 translate-x-4 translate-y-4 transform opacity-10 transition-transform duration-500 group-hover:scale-110">
                    <div className="h-full w-full rounded-full bg-white/20" />
                  </div>
                  <div className="relative z-10">
                    <div className="mb-3 flex items-start justify-between">
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                        Promo
                      </span>
                      <span className="text-xs opacity-80">{n.timestamp}</span>
                    </div>
                    <h3 className="mb-1 text-xl font-bold">{n.title}</h3>
                    <p className="mb-4 max-w-[80%] text-sm opacity-90">
                      {n.description}
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markAsRead(n.id)
                }}
                className={`${n.span} border bg-card ${isAlert ? "border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10" : "border-border"} ${
                  n.borderColor
                    ? `border-l-4 ${n.borderColor}`
                    : "rounded-xl border"
                } group cursor-pointer rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${!n.isRead ? "ring-1 ring-primary/10" : ""}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`h-10 w-10 rounded-full ${n.iconBg} flex flex-shrink-0 items-center justify-center ${isAlert ? "animate-pulse" : ""}`}
                  >
                    <div className={n.iconColor}>{n.icon}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3
                        className={`text-sm font-bold ${isAlert ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
                      >
                        {!n.isRead && (
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary align-middle" />
                        )}
                        {n.title}
                      </h3>
                      <span className="flex-shrink-0 text-[11px] whitespace-nowrap text-muted-foreground/60">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {n.description}
                    </p>
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
