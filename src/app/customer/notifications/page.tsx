import { CustomerNotificationsFeed } from "@/features/customer-dashboard"
import { RoleGate } from "@/components/role-gate"

export default function CustomerNotificationsPage() {
  return (
    <RoleGate allow={["customer"]}>
      <CustomerNotificationsFeed />
    </RoleGate>
  )
}
