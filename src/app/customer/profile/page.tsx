"use client"

import { PageHeader } from "@/components/layouts"
import { CustomerProfile } from "@/features/customer-dashboard"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />
      <CustomerProfile />
    </div>
  )
}
