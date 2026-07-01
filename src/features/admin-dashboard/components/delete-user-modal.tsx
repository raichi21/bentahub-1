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

export function DeleteUserModal({ isOpen, onClose, userId, userName, token, onSuccess }: DeleteUserModalProps) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
            <Trash2 className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">Delete User</h2>

          {error && (
            <div className="w-full p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">{error}</div>
          )}

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Are you sure you want to delete <strong className="text-foreground">{userName}</strong>? This will deactivate their account.
          </p>

          <div className="flex items-center gap-3 w-full">
            <button type="button" className="flex-1 h-12 px-4 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-muted transition-all" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="flex-1 h-12 px-4 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
