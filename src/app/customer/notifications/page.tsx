import { CustomerNotificationsFeed } from "@/features/customer-dashboard"
import { AuthGate } from "@/components/auth-gate"

export default function CustomerNotificationsPage() {
  return (
    <AuthGate>
      <CustomerNotificationsFeed />
    </AuthGate>
  )
}
