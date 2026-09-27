"use client"

import { useParams } from "next/navigation"
import { CatalogProductDetail } from "@/features/catalog/components/catalog-product-detail"
import { RoleGate } from "@/components/role-gate"

export default function CustomerProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  return (
    <RoleGate allow={["customer"]}>
      <CatalogProductDetail key={productId} basePath="/customer/catalog" />
    </RoleGate>
  )
}
