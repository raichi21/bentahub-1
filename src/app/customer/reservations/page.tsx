"use client"

import { useEffect, useState, useMemo } from "react"
import { 
  ReservationCard, 
  ReservationSummary 
} from "@/features/customer-dashboard"
import type { ReservationData } from "@/features/customer-dashboard/components/reservation-card"
import { cn, formatOrderId, formatOrderTitle } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import { Loader2 } from "lucide-react"

export default function ReservationsPage() {
  const tabs = ["All", "Processing", "Ready", "Completed"]
  const [activeTab, setActiveTab] = useState("All")
  const { orders, fetchOrders, isLoading } = useOrders()

  // Demo reservations fallback
  const demoReservations: ReservationData[] = [
    {
      id: "#BH-0001",
      title: "Monthly Grocery Essentials",
      description: "Bulk order for monthly supplies including rice, canned goods, and condiments.",
      status: "ready",
      date: "May 20, 2026",
      location: "Main Branch",
      items: "12 items",
      shipping: "Standard Pickup",
      image: "/images/dashboard/product-1.png",
    },
    {
      id: "#BH-0002",
      title: "Baking Supplies",
      description: "Ingredients for weekend baking session.",
      status: "processing",
      date: "May 22, 2026",
      location: "Pulong Buhangin Branch",
      items: "5 items",
      shipping: "Standard Pickup",
      image: "/images/dashboard/product-2.png",
    },
    {
      id: "#BH-0003",
      title: "Quick Snacks",
      description: "Assorted snacks and drinks.",
      status: "completed",
      date: "May 15, 2026",
      location: "Caypombo Branch",
      items: "8 items",
      shipping: "Standard Pickup",
      image: "/images/dashboard/product-3.png",
    },
  ]

  // Fetch orders on component mount
  useEffect(() => {
    if (!isLoading && orders.length === 0) {
      fetchOrders()
    }
  }, [fetchOrders, isLoading, orders.length])

  // Convert orders to reservation format
  const reservations: ReservationData[] = useMemo(() => {
    if (orders.length > 0) {
      return orders.map((order) => ({
        id: formatOrderId(order.id),
        title: formatOrderTitle(order.id),
        description: `${order.items?.length || 0} items • Total: ₱${Number(order.totalAmount).toFixed(2)}`,
        status: (order.status === "completed" ? "completed" : order.status === "ready" ? "ready" : "processing") as "processing" | "ready" | "completed",
        date: new Date(order.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        location: order.branch || "Main Branch",
        items: `${order.items?.length || 0} items`,
        shipping: "Standard Pickup",
        image: "/images/dashboard/product-1.png",
      }))
    }
    return demoReservations
  }, [orders])

  // Filter reservations based on active tab
  const filteredReservations = useMemo(() => {
    if (activeTab === "All") return reservations
    return reservations.filter((res) => res.status === activeTab.toLowerCase())
  }, [reservations, activeTab])

  const featuredReservation = filteredReservations[0] || reservations[0]
  const otherReservations = filteredReservations.slice(1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            My Reservations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your reserved items for pickup.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredReservations.length}</span> reservations
        </div>
      </div>

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

      {isLoading && filteredReservations.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <p className="text-muted-foreground">No {activeTab.toLowerCase()} reservations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured Reservation + Compact List */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {activeTab === "All" ? "Active Reservation" : `${activeTab} Reservations`}
            </h2>
            
            <ReservationCard variant="featured" data={featuredReservation} />

            {otherReservations.length > 0 && (
              <div className="pt-2">
                <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
                  Other Reservations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherReservations.map((res) => (
                    <ReservationCard key={res.id} variant="compact" data={res} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-4">
            <ReservationSummary />
          </div>
        </div>
      )}
    </div>
  )
}
