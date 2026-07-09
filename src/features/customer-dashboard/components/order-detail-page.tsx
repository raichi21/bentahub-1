"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, FileText, CreditCard, Calendar, Clock, ShoppingBag, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, ContentCard } from "@/components/layouts"
import { OrderTracker } from "./order-tracker"
import { CancelOrderModal } from "./cancel-order-modal"
import { useOrders } from "@/hooks/useOrders"
import { formatOrderId, cn } from "@/lib/utils"
import type { Order } from "@/stores/ordersStore"

interface OrderDetailPageProps {
  orderId: string
}

const statusColorMap: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const router = useRouter()
  const { orders, fetchOrders, cancelOrder } = useOrders()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    async function load() {
      if (orders.length === 0) {
        await fetchOrders()
      }
      const found = orders.find((o) => o.id === orderId)
      if (found) {
        setOrder(found)
      } else {
        // Try single-order fetch
        try {
          const res = await fetch(`/api/customer/orders/${orderId}`)
          const data = await res.json()
          if (data.success) setOrder(data.data)
        } catch (err) {
          console.error("Failed to fetch order:", err)
        }
      }
      setLoading(false)
    }
    load()
  }, [orderId, orders, fetchOrders])

  useEffect(() => {
    const found = orders.find((o) => o.id === orderId)
    if (!found) return
    const timer = setTimeout(() => setOrder(found), 0)
    return () => clearTimeout(timer)
  }, [orders, orderId])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order Details" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader title="Order Details" />
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">Order not found</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push("/customer/orders")}>
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
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <PageHeader
          title={`Order ${formatOrderId(orderId)}`}
          description={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        />
      </div>

      {/* Status Tracker */}
      <ContentCard title="Order Status">
        <OrderTracker status={order.status as any} />
      </ContentCard>

      {/* Order Info */}
      <ContentCard title="Order Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Store className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Branch</p>
              <p className="text-sm font-medium text-foreground">{order.branch}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payment</p>
              <p className="text-sm font-medium text-foreground capitalize">{order.paymentMethod}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</p>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5", statusColorMap[order.status])}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
          {order.pickupDeadline && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pickup Deadline</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(order.pickupDeadline).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
            <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">₱{Number(item.subtotal).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
          <p className="text-sm font-bold text-foreground">Total</p>
          <p className="text-lg font-bold text-primary">₱{Number(order.totalAmount).toFixed(2)}</p>
        </div>
      </ContentCard>

      {/* Actions */}
      {canCancel && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
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
