"use client"

import { CustomerProfile } from "@/features/customer-dashboard"
import { AuthGate } from "@/components/auth-gate"

export default function ProfilePage() {
  return (
    <AuthGate>
      <div className="space-y-6">
        <CustomerProfile />
      </div>
    </AuthGate>
  )
}
