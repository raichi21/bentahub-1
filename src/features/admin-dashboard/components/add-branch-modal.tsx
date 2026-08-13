"use client"

import React, { useState } from "react"
import { Store, X, Loader2 } from "lucide-react"

interface AddBranchModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSuccess: () => void
}

export function AddBranchModal({ isOpen, onClose, token, onSuccess }: AddBranchModalProps) {
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || null,
          capacity: parseInt(capacity, 10) || 500,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setName(""); setLocation(""); setCapacity("500")
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Add New Branch</h2>
          </div>
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
            )}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch Name</label>
                <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" placeholder="e.g. Lourdes Branch" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" placeholder="e.g. Lourdes, Cagayan de Oro City" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Capacity</label>
                <input className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm" placeholder="500" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-muted/20 flex items-center justify-end gap-3 border-t border-border">
            <button type="button" className="h-11 px-6 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-all" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="h-11 px-8 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
