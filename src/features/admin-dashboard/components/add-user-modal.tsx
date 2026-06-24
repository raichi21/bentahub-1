"use client"

import React, { useState } from "react"
import { UserPlus, X, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd?: (user: {
    name: string
    email: string
    role: "Admin" | "Cashier" | "Staff"
    branch: string
  }) => void
}

export function AddUserModal({ isOpen, onClose, onAdd }: AddUserModalProps) {
  const { token } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [emailUsername, setEmailUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"Admin" | "Cashier" | "Staff">("Cashier")
  const [branch, setBranch] = useState("All Branches")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalEmail = email || `${emailUsername}@bentahub.com`
    if (!name || !finalEmail || !password) return

    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: name,
          email: finalEmail,
          password,
          role: role.toLowerCase(),
          branch: branch === "All Branches" ? undefined : branch,
        }),
      })

      const json = await res.json()

      if (!json.success) {
        setError(json.message || "Failed to create user")
        setSaving(false)
        return
      }

      onAdd?.({ name, email: finalEmail, role, branch })
      setName("")
      setEmail("")
      setEmailUsername("")
      setPassword("")
      setRole("Cashier")
      setBranch("All Branches")
      setError("")
      onClose()
    } catch {
      setError("An unexpected error occurred")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border animate-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Add New User</h2>
          </div>
          <button
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                  placeholder="e.g. Juana Cruz"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                {!email ? (
                  <div className="flex items-center gap-0">
                    <input
                      className="w-full h-11 px-4 rounded-l-lg border border-r-0 border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                      placeholder="username"
                      type="text"
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      disabled={saving}
                    />
                    <span className="inline-flex items-center h-11 px-3 rounded-r-lg border border-border bg-muted text-sm text-muted-foreground font-medium whitespace-nowrap">
                      @bentahub.com
                    </span>
                  </div>
                ) : (
                  <input
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {email ? (
                    <button
                      type="button"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                      onClick={() => setEmail("")}
                    >
                      Use @bentahub.com instead
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                      onClick={() => { setEmail("custom"); setTimeout(() => setEmail(""), 0) }}
                    >
                      Use a custom email instead
                    </button>
                  )}
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    className="w-full h-11 pl-4 pr-12 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Two Columns: Role & Branch */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                  <select
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "Admin" | "Cashier" | "Staff")}
                    disabled={saving}
                  >
                    <option value="Cashier">Cashier</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</label>
                  <select
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={saving}
                  >
                    <option value="All Branches">All Branches</option>
                    <option value="Lourdes Main Branch">Lourdes Main Branch</option>
                    <option value="Lourdes 2nd Branch">Lourdes 2nd Branch</option>
                    <option value="Lourdes 3rd Branch">Lourdes 3rd Branch</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-muted/20 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              className="h-11 px-6 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-8 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {saving ? "Creating..." : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
