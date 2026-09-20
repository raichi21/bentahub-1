"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Store,
  CreditCard,
  Calendar,
  Clock,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, ContentCard } from "@/components/layouts"
import { OrderTracker } from "./order-tracker"
import { CancelOrderModal } from "./cancel-order-modal"
import { useOrders } from "@/hooks/useOrders"
import { useAuth } from "@/hooks/useAuth"
import { formatOrderId, cn } from "@/lib/utils"
import type { Order } from "@/stores/ordersStore"

interface OrderDetailPageProps {
  orderId: string
}

const statusColorMap: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  processing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ready:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter()
  const { orders, fetchOrders, cancelOrder } = useOrders()
  const { token } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const fetchedAllRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (cancelled) return

      // Find order in the existing orders list
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder(found)
        setLoading(false)
        return
      }

      // No orders loaded yet — fetch the full list once per mount
      if (orders.length === 0 && !fetchedAllRef.current) {
        fetchedAllRef.current = true
        try {
          await fetchOrders()
        } catch {
          // fetchOrders sets its own error state; show "not found"
          if (!cancelled) setLoading(false)
          return
        }
        if (cancelled) return
        // On success, effect re-runs via orders dependency; don't set loading=false to avoid flash
        return
      }

      // Not in the list — try single-order fetch as fallback
      try {
        const res = await fetch(`/api/customer/orders/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const data = await res.json()
        if (data.success && !cancelled) setOrder(data.data)
      } catch (err) {
        console.error("Failed to fetch order:", err)
      }
      if (!cancelled) setLoading(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [orderId, orders, fetchOrders, token])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order Details" />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order Details" />
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">Order not found</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => router.push("/customer/orders")}
          >
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const canCancel = order.status === "pending" || order.status === "processing"

  async function handleConfirmCancel() {
    await cancelOrder(orderId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Order ${formatOrderId(orderId)}`}
          description={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        />
      </div>

      {/* Status Tracker */}
      <ContentCard title="Order Status">
        <OrderTracker
          status={
            order.status as
              | "pending"
              | "processing"
              | "ready"
              | "completed"
              | "cancelled"
          }
        />
      </ContentCard>

      {order.status === "cancelled" && order.cancelledReason && (
        <ContentCard title="Cancellation Reason">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {order.cancelledReason}
            </p>
          </div>
        </ContentCard>
      )}

      {/* Order Info */}
      <ContentCard title="Order Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Store className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Branch
              </p>
              <p className="text-sm font-medium text-foreground">
                {order.branch}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Payment
              </p>
              <p className="text-sm font-medium text-foreground capitalize">
                {order.paymentMethod}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                Status
              </p>
              <span
                className={cn(
                  "mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  statusColorMap[order.status]
                )}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          {order.pickupDeadline && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Pickup Deadline
                </p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(order.pickupDeadline).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Order Items */}
      <ContentCard title="Items">
        <div className="divide-y divide-border">
          {(order.items ?? []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">
                ₱{Number(item.subtotal).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
          <p className="text-sm font-bold text-foreground">Total</p>
          <p className="text-lg font-bold text-primary">
            ₱{Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
      </ContentCard>

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Order
          </Button>
        </div>
      )}

      <CancelOrderModal
        orderId={orderId}
        orderLabel={formatOrderId(orderId)}
        amount={`₱${Number(order.totalAmount).toFixed(2)}`}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
