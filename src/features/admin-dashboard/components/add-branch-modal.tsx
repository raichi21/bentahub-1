"use client"

import React, { useState } from "react"
import { Store, X, Loader2 } from "lucide-react"

interface AddBranchModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSuccess: () => void
}

export function AddBranchModal({
  isOpen,
  onClose,
  token,
  onSuccess,
}: AddBranchModalProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("500")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Branch name is required")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || null,
          capacity: parseInt(capacity, 10) || 500,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setName("")
        setLocation("")
        setCapacity("500")
        onSuccess()
      } else {
        setError(data.message || "Failed to create branch")
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
              <Store className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Add New Branch
            </h2>
          </div>
          <button
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 p-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Branch Name
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Lourdes Branch"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Location
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Lourdes, Cagayan de Oro City"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Capacity
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  placeholder="500"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
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
              Add Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
