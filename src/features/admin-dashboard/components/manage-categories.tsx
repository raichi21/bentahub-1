"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Pencil,
  Search,
  Loader2,
  Tags,
  X,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { DeleteCatalogItemModal } from "./delete-catalog-item-modal"

interface CategoryRow {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
  productCount?: number
}

interface ManageCategoriesProps {
  canManage: boolean
}

export function ManageCategories({ canManage }: ManageCategoriesProps) {
  const { token, user } = useAuth()
  const [items, setItems] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [deleting, setDeleting] = useState<CategoryRow | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isAdmin = user?.role === "admin"
  const canManageEffective = isAdmin || canManage

  const fetchItems = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories", {
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
  }, [token])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchItems])

  const openAdd = () => {
    setEditing(null)
    setName("")
    setCode("")
    setDescription("")
    setIsActive(true)
    setError("")
    setShowForm(true)
  }

  const openEdit = (item: CategoryRow) => {
    setEditing(item)
    setName(item.name)
    setCode(item.code)
    setDescription(item.description || "")
    setIsActive(item.isActive)
    setError("")
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(
        editing
          ? `/api/admin/categories?id=${editing.id}`
          : "/api/admin/categories",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            code,
            description,
            ...(editing ? { isActive } : {}),
          }),
        }
      )
      const data = await res.json()
      if (data.success) {
        setShowForm(false)
        fetchItems()
      } else {
        setError(data.message || "Failed to save category")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const setActive = async (item: CategoryRow, active: boolean) => {
    if (!token) return
    setError("")
    try {
      const res = await fetch(`/api/admin/categories?id=${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: active }),
      })
      const data = await res.json()
      if (data.success) {
        fetchItems()
      } else {
        setError(data.message || "Failed to update category")
      }
    } catch {
      setError("An error occurred")
    }
  }

  const handleDeactivate = (item: CategoryRow) => setActive(item, false)
  const handleActivate = (item: CategoryRow) => setActive(item, true)

  const filtered = items.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-lg font-bold text-foreground">Categories</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Master product categories used across the catalog and SKU
            generation.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
            />
          </div>
          {canManageEffective && (
            <button
              onClick={openAdd}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-95 active:scale-[0.98] md:w-auto"
            >
              <Plus className="h-[18px] w-[18px]" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 pt-4">
          <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-[11px] font-bold tracking-widest uppercase">
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-center">Status</th>
              {canManageEffective && (
                <th className="px-6 py-4 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={5}>
                  <div className="flex animate-pulse flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Tags className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">
                      Loading categories...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={5}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Tags className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">
                      No categories found.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-primary/5"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {c.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 font-mono text-xs font-bold text-foreground">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {c.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                        c.isActive
                          ? "border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border border-destructive/20 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-green-500" : "bg-destructive"}`}
                      />
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManageEffective && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                          aria-label="Edit category"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {c.isActive ? (
                          <button
                            onClick={() => handleDeactivate(c)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Deactivate category"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(c)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
                            aria-label="Reactivate category"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleting(c)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="my-auto w-full max-w-md animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <h3 className="text-lg font-bold text-foreground">
                {editing ? "Edit Category" : "Add Category"}
              </h3>
              <button
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setShowForm(false)}
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
                    Category Name
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Code
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm uppercase transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="e.g. GRC"
                    maxLength={10}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Used as the SKU prefix when staff add products.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Description (optional)
                  </label>
                  <textarea
                    className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {editing && (
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Category Status
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isActive
                          ? "Visible for staff when adding products"
                          : "Hidden from staff product selection"}
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
                )}
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
                <button
                  type="button"
                  className="h-11 rounded-lg px-6 text-sm font-bold text-muted-foreground transition-all hover:bg-muted"
                  onClick={() => setShowForm(false)}
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
                  {editing ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteCatalogItemModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        itemId={deleting?.id || ""}
        itemName={deleting?.name || ""}
        itemKind="category"
        productCount={deleting?.productCount ?? 0}
        token={token}
        onSuccess={() => {
          setDeleting(null)
          fetchItems()
        }}
      />
    </section>
  )
}
