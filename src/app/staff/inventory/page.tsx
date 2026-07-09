"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { InventoryUpdateTable } from "@/features/staff-dashboard/components/inventory-update-table"
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
          name: p.name,
          price: p.price,
          category: p.category as Product["category"],
          stock: p.stock,
          reorderLevel: p.reorderLevel,
          image: p.image || "",
          unit: "pcs",
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

  const handleAddProduct = async (data: { name: string; sku?: string; category: string; stock: number; reorderLevel: number; unit: string; price: number; image?: string }) => {
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
              <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-4" />
                <div className="h-7 bg-muted rounded w-12 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            ))
          : <>
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-muted-foreground">Total Products</span>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">{stockSummary.total}</h3>
                <span className="text-xs text-muted-foreground font-medium">All SKUs</span>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-muted-foreground">In Stock</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stockSummary.inStock}</h3>
                <span className="text-xs text-green-500 font-medium">Healthy stock levels</span>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stockSummary.lowStock}</h3>
                <span className="text-xs text-amber-500 font-medium">Needs restocking</span>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow">
                <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
                <h3 className="text-2xl font-extrabold text-red-600 mt-1">{stockSummary.outOfStock}</h3>
                <span className="text-xs text-red-500 font-medium">Critical</span>
              </div>
            </>
        }
      </div>

      {!isLoading && (
        <InventoryUpdateTable
          products={products}
          onStockUpdate={handleStockUpdate}
          onAddProduct={handleAddProduct}
          savingId={savingId}
        />
      )}
    </div>
  )
}
