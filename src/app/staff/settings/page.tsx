"use client"

import { RoleGate } from "@/components/role-gate"
import { ContentCard } from "@/components/layouts"
import { MfaPanel } from "@/features/mfa"
import { useAuth } from "@/components/auth-provider"

export default function StaffSettingsPage() {
  return (
    <RoleGate allow={["staff"]}>
      <div className="flex flex-col gap-6 pb-8">
        <ContentCard subtitle="Manage your account and security settings.">
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Signed in as</p>
            <SignedInAs />
          </div>
        </ContentCard>

        <ContentCard
          title="Account Security"
          subtitle="Protect your staff account with two-factor authentication."
        >
          <MfaPanel />
        </ContentCard>
      </div>
    </RoleGate>
  )
}

function SignedInAs() {
  const { user } = useAuth()
  return (
    <p className="text-sm text-muted-foreground">
      {user?.fullName ?? "—"}
      {user?.email ? <span className="mx-1">•</span> : null}
      {user?.email ?? ""}
    </p>
  )
}
