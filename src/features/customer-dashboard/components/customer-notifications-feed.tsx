"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle, Wallet, AlertTriangle, Bell,
  ArrowRight, Percent, ShoppingBag, Loader2, Inbox
} from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"

type FilterTab = "all" | "orders" | "payments" | "offers"

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "offers", label: "Offers" },
]

function getDisplayType(
  type: string
): "order" | "payment" | "offer" | "alert" {
  if (type.startsWith("order")) return "order"
  if (type === "payment-received") return "payment"
  if (type === "promotion") return "offer"
  return "alert"
}

function getNotificationIcon(type: string) {
  if (type.startsWith("order")) return <CheckCircle className="w-5 h-5" />
  if (type === "payment-received") return <Wallet className="w-5 h-5" />
  if (type === "promotion") return <Percent className="w-5 h-5" />
  return <AlertTriangle className="w-5 h-5" />
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
  const { notifications, isLoading, fetchNotifications, markAllAsRead, markAsRead } = useNotifications()
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
          span: getDisplayType(n.type) === "offer" ? "md:col-span-3" : "md:col-span-2",
          layout: getDisplayType(n.type) === "offer" ? "featured" : ("default" as const),
        }
      }),
    [notifications]
  )

  const filtered = activeTab === "all"
    ? displayNotifications
    : displayNotifications.filter((n) => {
        if (activeTab === "orders") return n.type === "order"
        if (activeTab === "payments") return n.type === "payment"
        if (activeTab === "offers") return n.type === "offer" || n.type === "alert"
        return true
      })

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Stay updated with your latest activities and exclusive offers.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm transition-colors"
                : "px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/70 transition-colors"
            }
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={markAllAsRead}
          className="ml-auto flex items-center gap-1 cursor-pointer text-primary hover:underline"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="text-xs font-bold">Mark all as read</span>
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {isLoading ? (
          <div className="col-span-6 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-6 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              We&apos;ll notify you when something arrives.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const isAlert = n.type === "alert"

            if (n.layout === "featured") {
              return (
                <div
                  key={n.id}
                  className={`${n.span} relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 rounded-xl shadow-lg group`}
                >
                  <div className="absolute right-0 bottom-0 w-32 h-32 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
                    <div className="w-full h-full bg-white/20 rounded-full" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">
                        Promo
                      </span>
                      <span className="text-xs opacity-80">{n.timestamp}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{n.title}</h3>
                    <p className="text-sm opacity-90 mb-4 max-w-[80%]">{n.description}</p>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markAsRead(n.id) }}
                className={`${n.span} bg-card border ${isAlert ? "border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10" : "border-border"} ${
                  n.borderColor ? `border-l-4 ${n.borderColor}` : "rounded-xl border"
                } p-4 rounded-xl shadow-sm hover:shadow-md transition-all group cursor-pointer ${!n.isRead ? "ring-1 ring-primary/10" : ""}`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${n.iconBg} flex items-center justify-center flex-shrink-0 ${isAlert ? "animate-pulse" : ""}`}>
                    <div className={n.iconColor}>{n.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className={`text-sm font-bold ${isAlert ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                        {!n.isRead && (
                          <span className="inline-block w-2 h-2 bg-primary rounded-full mr-1.5 align-middle" />
                        )}
                        {n.title}
                      </h3>
                      <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap flex-shrink-0">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
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
