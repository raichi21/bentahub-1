"use client"

import { useParams } from "next/navigation"
import { CatalogProductDetail } from "@/features/catalog/components/catalog-product-detail"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  return <CatalogProductDetail key={productId} basePath="/catalog" />
}
