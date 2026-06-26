"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn, formatOrderId } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import { Loader2 } from "lucide-react"

export function RecentOrdersTable() {
  const router = useRouter()
  const { orders, fetchOrders, isLoading } = useOrders()

  // Demo orders fallback
  const demoOrders = [
    {
      id: "#BH-0001",
      date: "May 15, 2026",
      total: "₱1,250.00",
      status: "Ready for Pickup",
      statusVariant: "primary",
    },
    {
      id: "#BH-0002",
      date: "May 12, 2026",
      total: "₱450.50",
      status: "Completed",
      statusVariant: "secondary",
    },
    {
      id: "#BH-0003",
      date: "May 10, 2026",
      total: "₱890.00",
      status: "Pending",
      statusVariant: "warning",
    },
  ]

  // Fetch orders on component mount
  useEffect(() => {
    if (!isLoading && orders.length === 0) {
      fetchOrders()
    }
  }, [fetchOrders, isLoading, orders.length])

  // Convert orders to display format (hide cancelled)
  const displayOrders = useMemo(() => {
    if (orders.length > 0) {
      return orders
        .filter((o) => o.status !== "cancelled")
        .slice(0, 3)
        .map((order) => ({
          id: formatOrderId(order.id),
          date: new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }),
          total: `₱${Number(order.totalAmount).toFixed(2)}`,
          status: 
            order.status === "ready" ? "Ready for Pickup" :
            order.status === "completed" ? "Completed" :
            "Processing",
          statusVariant: 
            order.status === "ready" ? "primary" :
            order.status === "completed" ? "secondary" :
            "warning" as "primary" | "secondary" | "warning",
        }))
    }
    return demoOrders
  }, [orders])

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
        <h2 className="font-heading text-lg font-bold">Recent Orders</h2>
        <Link 
          href="/customer/orders" 
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading && displayOrders === demoOrders ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 md:px-6 py-3 font-medium">Order ID</th>
                <th className="px-4 md:px-6 py-3 font-medium">Date</th>
                <th className="px-4 md:px-6 py-3 font-medium">Total</th>
                <th className="px-4 md:px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order) => (
                <tr 
                  key={order.id}
                  onClick={() => router.push("/customer/orders")}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 md:px-6 py-4 font-mono text-sm text-foreground">
                    {order.id}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-muted-foreground">
                    {order.date}
                  </td>
                  <td className="px-4 md:px-6 py-4 font-bold text-foreground">
                    {order.total}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span 
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        order.statusVariant === "primary" && "bg-primary/15 text-primary",
                        order.statusVariant === "secondary" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        order.statusVariant === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
