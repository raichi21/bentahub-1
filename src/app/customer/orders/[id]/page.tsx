"use client"

import { useParams } from "next/navigation"
import { OrderDetailPage } from "@/features/customer-dashboard"
import { RoleGate } from "@/components/role-gate"

export default function OrderDetailRoute() {
  const params = useParams()
  const orderId = params.id as string
  return (
    <RoleGate allow={["customer"]}>
      <OrderDetailPage orderId={orderId} />
    </RoleGate>
  )
}
