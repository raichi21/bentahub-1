"use client"

import { Suspense } from "react"
import { CatalogView } from "@/features/catalog/components/catalog-view"

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogLoading />}>
      <CatalogView basePath="/catalog" />
    </Suspense>
  )
}

function CatalogLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  )
}
