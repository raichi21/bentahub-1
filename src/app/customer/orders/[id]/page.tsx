"use client"

import { useParams } from "next/navigation"
import { OrderDetailPage } from "@/features/customer-dashboard"
import { AuthGate } from "@/components/auth-gate"

export default function OrderDetailRoute() {
  const params = useParams()
  const orderId = params.id as string
  return (
    <AuthGate>
      <OrderDetailPage orderId={orderId} />
    </AuthGate>
  )
}
