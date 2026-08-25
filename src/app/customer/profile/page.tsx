"use client"

import { CustomerProfile } from "@/features/customer-dashboard"
import { RoleGate } from "@/components/role-gate"

export default function ProfilePage() {
  return (
    <RoleGate allow={["customer"]}>
      <div className="space-y-6">
        <CustomerProfile />
      </div>
    </RoleGate>
  )
}
