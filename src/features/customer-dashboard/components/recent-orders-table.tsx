"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn, formatOrderId } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import { Loader2 } from "lucide-react"

export function RecentOrdersTable() {
  const router = useRouter()
  const { orders, fetchOrders, isLoading } = useOrders()
  const hasFetched = useRef(false)

  // Fetch orders on component mount
  useEffect(() => {
    if (!isLoading && orders.length === 0 && !hasFetched.current) {
      hasFetched.current = true
      fetchOrders()
    }
  }, [fetchOrders, isLoading, orders.length])

  // Convert orders to display format (hide cancelled)
  const displayOrders = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .slice(0, 3)
      .map((order) => ({
        id: formatOrderId(order.id),
        rawId: order.id,
        date: new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        total: `₱${Number(order.totalAmount).toFixed(2)}`,
        status:
          order.status === "pending"
            ? "Pending"
            : order.status === "ready"
              ? "Ready for Pickup"
              : order.status === "completed"
                ? "Completed"
                : "Processing",
        statusVariant:
          order.status === "pending"
            ? "warning"
            : order.status === "ready"
              ? "primary"
              : order.status === "completed"
                ? "secondary"
                : ("warning" as "primary" | "secondary" | "warning"),
      }))
  }, [orders])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-heading text-lg font-bold">Recent Orders</h2>
        <Link
          href="/customer/orders"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium md:px-6">Order ID</th>
                <th className="px-4 py-3 font-medium md:px-6">Date</th>
                <th className="px-4 py-3 font-medium md:px-6">Total</th>
                <th className="px-4 py-3 font-medium md:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-sm text-muted-foreground"
                  >
                    No recent orders yet.
                  </td>
                </tr>
              ) : (
                displayOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() =>
                      router.push(`/customer/orders/${order.rawId}`)
                    }
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-4 font-mono text-sm text-foreground md:px-6">
                      {order.id}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground md:px-6">
                      {order.date}
                    </td>
                    <td className="px-4 py-4 font-bold text-foreground md:px-6">
                      {order.total}
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          order.statusVariant === "primary" &&
                            "bg-primary/15 text-primary",
                          order.statusVariant === "secondary" &&
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          order.statusVariant === "warning" &&
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
