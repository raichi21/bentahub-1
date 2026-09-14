"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Search, Package } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { EditProductModal, type ProductRowData } from "./edit-product-modal"

interface CategoryOption {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface UnitOption {
  id: string
  name: string
  isActive: boolean
}

interface ManageProductsProps {
  canManage: boolean
}

export function ManageProducts({ canManage }: ManageProductsProps) {
  const { token, user } = useAuth()
  const [items, setItems] = useState<ProductRowData[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [editing, setEditing] = useState<ProductRowData | null>(null)

  const isAdmin = user?.role === "admin"
  const canManageEffective = isAdmin || canManage

  const fetchItems = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (categoryFilter) params.set("category", categoryFilter)
      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setItems(Array.isArray(data.data) ? data.data : [])
      }
    } catch {
      // no-op
    } finally {
      setLoading(false)
    }
  }, [token, search, categoryFilter])

  const fetchOptions = useCallback(async () => {
    if (!token) return
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/units", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      const catData = await catRes.json()
      const unitData = await unitRes.json()
      if (catData.success)
        setCategories(Array.isArray(catData.data) ? catData.data : [])
      if (unitData.success)
        setUnits(Array.isArray(unitData.data) ? unitData.data : [])
    } catch {
      // no-op
    }
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOptions()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchOptions])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchItems])

  const formatPrice = (value: string | null | undefined) => {
    if (value === null || value === undefined || value === "") return "—"
    return `₱${Number(value).toFixed(2)}`
  }

  const distinctCategories = categories
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b))

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-muted/20 p-6">
        <div>
          <h4 className="text-lg font-bold text-foreground">Product List</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Master catalog across all branches. Stock counts live in Monitoring.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-primary"
          >
            <option value="">All Categories</option>
            {distinctCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-[11px] font-bold tracking-widest uppercase">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-center">Unit</th>
              <th className="px-6 py-4 text-right">Retail</th>
              <th className="px-6 py-4 text-right">Wholesale</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4 text-center">Status</th>
              {canManageEffective && (
                <th className="px-6 py-4 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={9}>
                  <div className="flex animate-pulse flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">
                      Loading products...
                    </p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={9}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">
                      No products found.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Staff add products through the inventory panel.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr
                  key={p.id}
                  className="group transition-colors hover:bg-primary/5"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {p.sku || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {p.category}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 font-mono text-xs font-bold text-foreground uppercase">
                      {p.unit || "pcs"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                    {formatPrice(p.bulkPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {p.branch}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                        p.isActive
                          ? "border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border border-destructive/20 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${p.isActive ? "bg-green-500" : "bg-destructive"}`}
                      />
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManageEffective && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditProductModal
        key={editing?.id || "none"}
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        product={editing}
        categories={categories}
        units={units}
        token={token}
        onSuccess={() => {
          setEditing(null)
          fetchItems()
        }}
      />
    </section>
  )
}
