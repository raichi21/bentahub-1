"use client"

import React, { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  token: string | null
  onSuccess: () => void
}

export function DeleteUserModal({
  isOpen,
  onClose,
  userId,
  userName,
  token,
  onSuccess,
}: DeleteUserModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleDelete = async () => {
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || "Failed to deactivate user")
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
            Delete User
          </h2>

          {error && (
            <div className="mb-4 w-full rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{userName}</strong>? This will
            deactivate their account.
          </p>

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
