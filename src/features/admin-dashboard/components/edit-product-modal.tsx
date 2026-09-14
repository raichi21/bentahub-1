"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Package } from "lucide-react"

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

export interface ProductRowData {
  id: string
  name: string
  description: string | null
  category: string
  price: string
  bulkPrice: string | null
  unit: string
  sku: string | null
  barcode: string | null
  branch: string
  isActive: boolean
  quantity: number
}

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductRowData | null
  categories: CategoryOption[]
  units: UnitOption[]
  token: string | null
  onSuccess: () => void
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  categories,
  units,
  token,
  onSuccess,
}: EditProductModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [unit, setUnit] = useState("")
  const [price, setPrice] = useState("")
  const [bulkPrice, setBulkPrice] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!product) return
    const timer = setTimeout(() => {
      setName(product.name)
      setCategory(product.category)
      setUnit(product.unit || "pcs")
      setPrice(product.price)
      setBulkPrice(product.bulkPrice ?? "")
      setDescription(product.description || "")
      setIsActive(product.isActive)
      setError("")
    }, 0)
    return () => clearTimeout(timer)
  }, [product])

  if (!isOpen || !product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          unit,
          price: Number(price),
          bulkPrice: bulkPrice.trim() ? Number(bulkPrice) : null,
          description,
          isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || "Failed to update product")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto w-full max-w-lg animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Edit Product
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {product.sku ? `SKU: ${product.sku}` : "Master catalog entry"}
              </p>
            </div>
          </div>
          <button
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Product Name
              </label>
              <input
                className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Category
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Unit
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                >
                  {units
                    .filter((u) => u.isActive)
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Retail Price (₱)
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Wholesale Price (₱) — optional
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 85.00"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Description (optional)
              </label>
              <textarea
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Product Status
                </p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? "Visible in the catalog"
                    : "Hidden from the catalog"}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
            <button
              type="button"
              className="h-11 rounded-lg px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex h-11 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-95 active:scale-[0.98]"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
