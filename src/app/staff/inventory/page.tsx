"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { InventoryUpdateTable } from "@/features/staff-dashboard/components/inventory-update-table"
import { BarcodeScanner } from "@/features/staff-dashboard/components/barcode-scanner"
import { QuickStockModal } from "@/features/staff-dashboard/components/quick-stock-modal"
import { KPICard } from "@/features/admin-dashboard"
import { Package, CheckCircle2, AlertTriangle, XCircle, Camera } from "lucide-react"
import { getStockStatus } from "@/lib/staff-utils"
import { findProductByBarcode } from "@/lib/barcode"
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
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scanEditProduct, setScanEditProduct] = useState<Product | null>(null)

  const handleScanToEdit = (code: string) => {
    setShowScanner(false)
    const found = findProductByBarcode(products, code)
    if (found) {
      setScanEditProduct(found)
    } else {
      setSaveError(`No product found with barcode: ${code}`)
      setTimeout(() => setSaveError(null), 4000)
    }
  }

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
          name: p.name,
          price: p.price,
          category: p.category as Product["category"],
          stock: p.stock,
          reorderLevel: p.reorderLevel,
          image: p.image || "",
          unit: "pcs",
          nearestExpiry: p.nearestExpiry,
        }),
      )
      setProducts(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setFetched(true)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!token) return
    const timer = setTimeout(() => fetchProducts(token), 0)
    return () => clearTimeout(timer)
  }, [token, authLoading, fetchProducts])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const handleStockUpdate = async (productId: string, newStock: number, newReorderLevel: number) => {
    if (!token) return

    setSavingId(productId)
    setSaveError(null)

    try {
      const res = await fetch("/api/staff/inventory", {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ productId, stock: newStock, reorderLevel: newReorderLevel }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update stock")
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: newStock, reorderLevel: newReorderLevel } : p
        )
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setSaveError(msg)
      setTimeout(() => setSaveError(null), 4000)
    } finally {
      setSavingId(null)
    }
  }

  const handleAddProduct = async (data: { name: string; sku?: string; category: string; stock: number; reorderLevel: number; unit: string; price: number; image?: string; batchNumber?: string; expiryDate?: string; supplier?: string }) => {
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
    const inStock = products.filter((p) => getStockStatus(p) === "in-stock").length
    const lowStock = products.filter((p) => getStockStatus(p) === "low-stock").length
    const outOfStock = products.filter((p) => getStockStatus(p) === "out-of-stock").length
    return { inStock, lowStock, outOfStock, total: products.length }
  }, [products])

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-32 bg-muted rounded" />
              </div>
            ))
          : <>
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
        }
      </div>

      {!isLoading && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Scan &amp; Update
            </button>
          </div>
          <InventoryUpdateTable
            products={products}
            onStockUpdate={handleStockUpdate}
            onAddProduct={handleAddProduct}
            savingId={savingId}
          />
        </>
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleScanToEdit} onClose={() => setShowScanner(false)} />
      )}
      <QuickStockModal
        isOpen={!!scanEditProduct}
        onClose={() => setScanEditProduct(null)}
        product={scanEditProduct}
        onSave={handleStockUpdate}
      />
    </div>
  )
}
