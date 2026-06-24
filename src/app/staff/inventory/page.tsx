"use client"

import { useState, useEffect, useMemo } from "react"
import { InventoryUpdateTable } from "@/features/staff-dashboard/components/inventory-update-table"
import { staffProducts } from "@/features/staff-dashboard/data/products"
import { getStockStatus } from "@/features/staff-dashboard/data/products"
import type { Product } from "@/types/cashier"

const STORAGE_KEY = "bentahub-staff-products"

function loadFromStorage(): Product[] {
  if (typeof window === "undefined") return staffProducts
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { return JSON.parse(stored) as Product[] }
    catch { return staffProducts }
  }
  return staffProducts
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(staffProducts)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount — prevents SSR mismatch
  useEffect(() => {
    const stored = loadFromStorage()
    setProducts(stored)
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever products change (but skip the initial hydration write)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }, [products, hydrated])

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
      </div>

      <InventoryUpdateTable products={products} onStockUpdate={handleStockUpdate} onAddProduct={handleAddProduct} />
    </div>
  )
}
