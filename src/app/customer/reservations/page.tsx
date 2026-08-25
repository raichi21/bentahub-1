"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { cn, formatOrderId, formatOrderTitle } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useOrders } from "@/hooks/useOrders"
import { Loader2, Package } from "lucide-react"
import { RoleGate } from "@/components/role-gate"

const ACTIVE_ORDER_TABS = ["All", "Pending", "Processing", "Ready"]

export default function ReservationsPage() {
  return (
    <RoleGate allow={["customer"]}>
      <ReservationsPageInner />
    </RoleGate>
  )
}

function ReservationsPageInner() {
  const router = useRouter()
  const tabs = ACTIVE_ORDER_TABS
  const [activeTab, setActiveTab] = useState("All")
  const { orders, fetchOrders, isLoading } = useOrders()
  const fetchedOnce = useRef(false)

  // Refetch on mount so the customer sees the latest status
  useEffect(() => {
    if (!fetchedOnce.current) {
      fetchedOnce.current = true
      fetchOrders()
    }
  }, [fetchOrders])

  // Refetch when the tab becomes visible (e.g., customer switches back from staff)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") fetchOrders() }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [fetchOrders])

  // Only show active orders (pending, processing, ready)
  const reservations = useMemo(() => {
    return orders.filter((o) =>
      o.status === "pending" || o.status === "processing" || o.status === "ready"
    )
  }, [orders])

  const filtered = useMemo(() => {
    if (activeTab === "All") return reservations
    return reservations.filter((r) => r.status === activeTab.toLowerCase())
  }, [reservations, activeTab])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            No {activeTab.toLowerCase()} reservations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/customer/orders/${order.id}`)}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {formatOrderId(order.id)}
                </span>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  order.status === "pending" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                  order.status === "processing" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  order.status === "ready" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                )}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground mb-1">
                {formatOrderTitle(order.id)}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {order.branch}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-sm font-bold text-primary">
                  ₱{Number(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
