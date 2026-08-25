"use client"

import { ShoppingBag, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useOrders } from "@/hooks/useOrders"
import { KPICard } from "@/features/admin-dashboard"
import { RecentOrdersTable, NearbyBranches } from "@/features/customer-dashboard"
import { PageHeader, ContentCard } from "@/components/layouts"
import { RoleGate } from "@/components/role-gate"

export default function CustomerPage() {
  return (
    <RoleGate allow={["customer"]}>
      <CustomerPageInner />
    </RoleGate>
  )
}

function CustomerPageInner() {
  const { user } = useAuth()
  const { orders } = useOrders()
  const displayName = user?.fullName || "Welcome"

  const totalOrders = orders.filter((o) => o.status !== "cancelled").length
  const activeReservations = orders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${displayName}!`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <KPICard
          title="Total Orders"
          value={String(totalOrders)}
          trend="All time orders"
          trendType="up"
          icon={ShoppingBag}
        />
        <KPICard
          title="Active Reservations"
          value={String(activeReservations)}
          trend="Pending / Processing"
          trendType="warning"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContentCard title="Recent Orders">
            <RecentOrdersTable />
          </ContentCard>
        </div>
        <div className="lg:col-span-1">
          <ContentCard title="Nearby Branches">
            <NearbyBranches />
          </ContentCard>
        </div>
      </div>
    </div>
  )
}
