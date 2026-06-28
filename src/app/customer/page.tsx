"use client"

import { useAuth } from "@/hooks/useAuth"
import { 
  SummaryCards, 
  RecentOrdersTable, 
  NearbyBranches 
} from "@/features/customer-dashboard"
import { PageHeader, ContentCard } from "@/components/layouts"

export default function CustomerPage() {
  const { user } = useAuth()
  const displayName = user?.fullName || "Welcome"

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${displayName}!`}
        description="Welcome back to your dashboard. Here&apos;s what&apos;s happening with your account."
      />

      <SummaryCards />

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
