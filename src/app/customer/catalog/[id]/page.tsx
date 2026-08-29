"use client"

import { CatalogProductDetail } from "@/features/catalog/components/catalog-product-detail"
import { RoleGate } from "@/components/role-gate"

export default function CustomerProductDetailPage() {
  return (
    <RoleGate allow={["customer"]}>
      <CatalogProductDetail basePath="/customer/catalog" />
    </RoleGate>
  )
}
