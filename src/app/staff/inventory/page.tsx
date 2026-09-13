"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { InventoryUpdateTable } from "@/features/staff-dashboard/components/inventory-update-table"
import { KPICard } from "@/features/admin-dashboard"
import { Package, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { getStockStatus } from "@/lib/staff-utils"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffProductItem } from "@/types/staff"

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export default function InventoryPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [units, setUnits] = useState<string[]>([])
  const [masterCategories, setMasterCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchProducts = useCallback(async (tok: string) => {
    try {
      const res = await fetch("/api/staff/products", {
        headers: authHeaders(tok),
      })

      if (!res.ok) throw new Error("Failed to load products")

      const json = await res.json()

      const mapped: Product[] = (json.data?.products || []).map(
        (p: StaffProductItem) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          price: p.price,
          category: p.category as Product["category"],
          stock: p.stock,
          reorderLevel: p.reorderLevel,
          image: p.image || "",
          unit: p.unit || "pcs",
          nearestExpiry: p.nearestExpiry,
          activeBatchCount: p.activeBatchCount ?? 0,
          batches: p.batches ?? [],
        })
      )
      setProducts(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFetched(true)
    }
  }, [])

  const fetchMasterData = useCallback(async (tok: string) => {
    try {
      const [unitsRes, catsRes] = await Promise.all([
        fetch("/api/admin/units", { headers: authHeaders(tok) }),
        fetch("/api/admin/categories", { headers: authHeaders(tok) }),
      ])
      const [unitsJson, catsJson] = await Promise.all([
        unitsRes.json(),
        catsRes.json(),
      ])

      if (unitsJson.success && Array.isArray(unitsJson.data)) {
        setUnits(
          unitsJson.data
            .filter((u: { isActive: boolean }) => u.isActive)
            .map((u: { name: string }) => u.name)
        )
      }
      if (catsJson.success && Array.isArray(catsJson.data)) {
        setMasterCategories(
          catsJson.data
            .filter((c: { isActive: boolean }) => c.isActive)
            .map((c: { name: string }) => c.name)
        )
      }
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    const timer = setTimeout(() => {
      fetchProducts(token)
      fetchMasterData(token)
    }, 0)
    return () => clearTimeout(timer)
  }, [token, authLoading, fetchProducts, fetchMasterData])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const handleStockUpdate = async (
    productId: string,
    newStock: number,
    newReorderLevel: number,
    batchInfo?: { batchNumber?: string; expiryDate?: string; supplier?: string }
  ) => {
    if (!token) return

    setSavingId(productId)
    setSaveError(null)

    try {
      const res = await fetch("/api/staff/inventory", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({
          productId,
          stock: newStock,
          reorderLevel: newReorderLevel,
          batchNumber: batchInfo?.batchNumber,
          expiryDate: batchInfo?.expiryDate,
          supplier: batchInfo?.supplier,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update stock")
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, stock: newStock, reorderLevel: newReorderLevel }
            : p
        )
      )
      await fetchProducts(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setSaveError(msg)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSavingId(null)
    }
  }

  const handleAddProduct = async (data: {
    name: string
    sku?: string
    barcode?: string
    category: string
    stock: number
    reorderLevel: number
    unit: string
    price: number
    image?: string
    batchNumber?: string
    expiryDate?: string
    supplier?: string
  }) => {
    if (!token) return

    try {
      const res = await fetch("/api/staff/inventory", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to add product")
      }

      await fetchProducts(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setSaveError(msg)
      setTimeout(() => setSaveError(null), 4000)
    }
  }

  const stockSummary = useMemo(() => {
    const inStock = products.filter(
      (p) => getStockStatus(p) === "in-stock"
    ).length
    const lowStock = products.filter(
      (p) => getStockStatus(p) === "low-stock"
    ).length
    const outOfStock = products.filter(
      (p) => getStockStatus(p) === "out-of-stock"
    ).length
    return { inStock, lowStock, outOfStock, total: products.length }
  }, [products])

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-32 rounded bg-muted" />
            </div>
          ))
        ) : (
          <>
            <KPICard
              title="Total Products"
              value={String(stockSummary.total)}
              trend="All SKUs"
              trendType="up"
              icon={Package}
            />
            <KPICard
              title="In Stock"
              value={String(stockSummary.inStock)}
              trend="Healthy stock levels"
              trendType="up"
              icon={CheckCircle2}
            />
            <KPICard
              title="Low Stock"
              value={String(stockSummary.lowStock)}
              trend="Needs restocking"
              trendType="warning"
              icon={AlertTriangle}
            />
            <KPICard
              title="Out of Stock"
              value={String(stockSummary.outOfStock)}
              trend="Critical"
              trendType="down"
              icon={XCircle}
            />
          </>
        )}
      </div>

      {!isLoading && (
        <InventoryUpdateTable
          products={products}
          onStockUpdate={handleStockUpdate}
          onAddProduct={handleAddProduct}
          savingId={savingId}
          units={units}
          categories={masterCategories}
        />
      )}
    </div>
  )
}
