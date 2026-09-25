"use client"

import React, { useState } from "react"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"

interface PermanentDeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  token: string | null
  onSuccess: () => void
}

export function PermanentDeleteUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  token,
  onSuccess,
}: PermanentDeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const canSubmit = confirmText.trim() === userName.trim() && !submitting

  const resetAndClose = () => {
    setConfirmText("")
    setError("")
    onClose()
  }

  const handleDelete = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${userId}/permanent`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setConfirmText("")
        setError("")
        onSuccess()
      } else {
        setError(data.message || "Failed to delete user")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="my-auto w-full max-w-md animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-8 w-8" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-foreground">
            Permanently Delete User
          </h2>

          {error && (
            <div className="mb-4 w-full rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            This will <strong className="text-foreground">permanently</strong>{" "}
            remove <strong className="text-foreground">{userName}</strong> and
            all of their auth, cart, and notification records. This cannot be
            undone.
          </p>

          <div className="mb-5 flex w-full items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-left">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-muted-foreground">
              Users with order history cannot be permanently deleted, to protect
              sales records. Deactivate them instead.
            </p>
          </div>

          <div className="mb-5 w-full space-y-1.5 text-left">
            <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Type “{userName}” to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={userName}
              className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/30"
            />
          </div>

          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              className="h-12 flex-1 rounded-lg border border-border px-4 text-sm font-bold text-foreground transition-all hover:bg-muted"
              onClick={resetAndClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-bold text-destructive-foreground shadow-lg shadow-destructive/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
              onClick={handleDelete}
              disabled={!canSubmit}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
