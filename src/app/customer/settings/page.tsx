"use client"

import { PageHeader } from "@/components/layouts"
import { CustomerSettings } from "@/features/customer-dashboard"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <CustomerSettings />
    </div>
  )
}
