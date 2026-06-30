"use client"

import { useState, useEffect, useMemo } from "react"
import { InventoryUpdateTable } from "@/features/staff-dashboard/components/inventory-update-table"
import { getStockStatus } from "@/features/staff-dashboard/data/products"
import { useAuth } from "@/hooks/useAuth"
import type { Product } from "@/types/cashier"
import type { StaffProductItem } from "@/types/staff"

export default function InventoryPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!token) return

    let cancelled = false

    async function fetchProducts() {
      try {
        const res = await fetch("/api/staff/products", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!res.ok) throw new Error("Failed to load products")

        const json = await res.json()

        if (cancelled) return

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
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred")
        }
      } finally {
        if (!cancelled) {
          setFetched(true)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
    }
  }, [token, authLoading])

  const isLoading = authLoading || (token !== null && !fetched && !error)

  const handleStockUpdate = (productId: string, newStock: number, newReorderLevel: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: newStock, reorderLevel: newReorderLevel } : p
      )
    )
  }

  const handleAddProduct = (data: { name: string; sku: string; category: string; stock: number; reorderLevel: number; unit: string; price: number; image?: string }) => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: data.sku,
      name: data.name,
      price: data.price,
      category: data.category as Product["category"],
      stock: data.stock,
      reorderLevel: data.reorderLevel,
      image: data.image || "",
      unit: data.unit,
    }
    setProducts((prev) => [...prev, newProduct])
  }

  const stockSummary = useMemo(() => {
    const inStock = products.filter((p) => getStockStatus(p) === "in-stock").length
    const lowStock = products.filter((p) => getStockStatus(p) === "low-stock").length
    const outOfStock = products.filter((p) => getStockStatus(p) === "out-of-stock").length
    return { inStock, lowStock, outOfStock, total: products.length }
  }, [products])

  return (
    <div className="space-y-6">
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
        <InventoryUpdateTable products={products} onStockUpdate={handleStockUpdate} onAddProduct={handleAddProduct} />
      )}
    </div>
  )
}
