"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Loader2, History } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { actionLabel } from "./activity-logs-table"

interface ProductHistoryEntry {
  id: string
  actorName: string | null
  actorRole: string | null
  action: string
  entityName: string | null
  details: Record<string, unknown> | null
  branch: string | null
  createdAt: string | Date
}

interface ProductHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function summarizeDetails(details: Record<string, unknown> | null): string {
  if (!details || typeof details !== "object") return ""
  return Object.entries(details)
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ")
}

export function ProductHistoryModal({
  isOpen,
  onClose,
  productId,
  productName,
}: ProductHistoryModalProps) {
  const { token } = useAuth()
  const [entries, setEntries] = useState<ProductHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        entity: "product",
        entityId: productId,
        page: "1",
        pageSize: "50",
      })
      const res = await fetch(`/api/admin/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setEntries(Array.isArray(json.data.logs) ? json.data.logs : [])
      } else {
        throw new Error(json.message || "Failed to load history")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [token, productId])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => fetchHistory(), 0)
    return () => clearTimeout(timer)
  }, [isOpen, fetchHistory])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Product History
              </h2>
              <p className="text-[11px] text-muted-foreground">{productName}</p>
            </div>
          </div>
          <button
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-6">
          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading history...
            </div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-red-500">
              Error: {error}
            </p>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <History className="h-7 w-7" />
              </div>
              <p className="font-semibold text-foreground">
                No recorded activity for this product yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Actions from now on will appear here with who did them.
              </p>
            </div>
          ) : (
            entries.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">
                    {e.actorName || "Unknown"}
                    {e.actorRole && (
                      <span className="ml-2 text-xs font-medium text-muted-foreground capitalize">
                        {e.actorRole}
                      </span>
                    )}
                  </p>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-primary uppercase">
                    {actionLabel(e.action)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(e.createdAt)}
                  {e.branch ? ` · ${e.branch}` : ""}
                </p>
                {summarizeDetails(e.details) && (
                  <p className="mt-2 text-xs text-foreground">
                    {summarizeDetails(e.details)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-foreground transition-all hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
