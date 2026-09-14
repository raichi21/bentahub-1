"use client"

import { useState } from "react"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"

interface DeleteCatalogItemModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  itemName: string
  itemKind: "category" | "unit"
  productCount: number
  token: string | null
  onSuccess: () => void
}

export function DeleteCatalogItemModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemKind,
  productCount,
  token,
  onSuccess,
}: DeleteCatalogItemModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleDelete = async () => {
    if (!token) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(
        `/api/admin/${itemKind === "category" ? "categories" : "units"}?id=${itemId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || "Failed to delete")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const label = itemKind === "category" ? "category" : "unit"

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto w-full max-w-md animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-8 w-8" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-foreground">
            Delete {label === "category" ? "Category" : "Unit"}
          </h2>

          {error && (
            <div className="mb-4 w-full rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to permanently delete{" "}
            <strong className="text-foreground">{itemName}</strong>? This cannot
            be undone.
          </p>

          {productCount > 0 && (
            <div className="mb-5 flex w-full items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-left">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  {productCount} product{productCount === 1 ? "" : "s"} still
                  use this {label}.
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  They will keep showing their current {label}, but staff can no
                  longer pick it for new items.
                </p>
              </div>
            </div>
          )}

          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-lg border border-border px-4 text-sm font-bold text-foreground transition-all hover:bg-muted"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:opacity-90 active:scale-[0.98]"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
