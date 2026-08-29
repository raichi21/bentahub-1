"use client"

import { Suspense } from "react"
import { CatalogView } from "@/features/catalog/components/catalog-view"
import { RoleGate } from "@/components/role-gate"

export default function CustomerCatalogPage() {
  return (
    <RoleGate allow={["customer"]}>
      <Suspense fallback={<CatalogLoading />}>
        <CatalogView basePath="/customer/catalog" />
      </Suspense>
    </RoleGate>
  )
}

function CatalogLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  )
}
