"use client"

import React, { useState, useEffect } from "react"
import { User, X, Eye, EyeOff, Loader2 } from "lucide-react"
import type { UserRowData } from "@/types/admin"

interface BranchOption {
  id: string
  name: string
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserRowData | null
  token: string | null
  onSuccess: () => void
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  token,
  onSuccess,
}: EditUserModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("cashier")
  const [branch, setBranch] = useState("")
  const [canManageUnits, setCanManageUnits] = useState(false)
  const [canManageCategories, setCanManageCategories] = useState(false)
  const [canManageProducts, setCanManageProducts] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => {
      setName(user.fullName)
      setEmail(user.email)
      setRole(user.role)
      setBranch(user.branch || "")
      setCanManageUnits(user.role === "admin" || !!user.canManageUnits)
      setCanManageCategories(
        user.role === "admin" || !!user.canManageCategories
      )
      setCanManageProducts(user.role === "admin" || !!user.canManageProducts)
      setNewPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowConfirmPassword(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [user])

  useEffect(() => {
    if (!isOpen || !token) return
    fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setBranches(d)
        else if (d.data && Array.isArray(d.data)) setBranches(d.data)
      })
      .catch(() => {})
  }, [isOpen, token])

  if (!isOpen || !user) return null

  // Admins are not bound to a single branch; Cashier & Staff need a real
  // branch because their POS/inventory queries are scoped by branch name.
  const handleRoleChange = (newRole: string) => {
    setRole(newRole)
    if (newRole === "admin") {
      setBranch("")
      setCanManageUnits(true)
      setCanManageCategories(true)
      setCanManageProducts(true)
    } else if (newRole !== "staff") {
      if (!branch) setBranch(branches[0]?.name || "")
      setCanManageUnits(false)
      setCanManageCategories(false)
      setCanManageProducts(false)
    } else {
      if (!branch) setBranch(branches[0]?.name || "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: name,
          email,
          role,
          branch: branch || null,
          password: newPassword || undefined,
          canManageUnits,
          canManageCategories,
          canManageProducts,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess()
      } else {
        setError(data.message || "Failed to update user")
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
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Edit User</h2>
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
                  Full Name
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
                  Email Address
                </label>
                <input
                  className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Role
                  </label>
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="staff">Staff</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Branch Assignment
                  </label>
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {role === "staff" && (
              <div className="border-t border-border pt-5">
                <h3 className="text-sm font-bold text-foreground">
                  Role Permissions
                </h3>
                <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                  Grant management access to the product management center.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      key: "units",
                      label: "Manage Units",
                      desc: "Create and edit unit types",
                      value: canManageUnits,
                      set: setCanManageUnits,
                    },
                    {
                      key: "categories",
                      label: "Manage Categories",
                      desc: "Create and edit product categories",
                      value: canManageCategories,
                      set: setCanManageCategories,
                    },
                    {
                      key: "products",
                      label: "Manage Products",
                      desc: "Create and edit the product catalog",
                      value: canManageProducts,
                      set: setCanManageProducts,
                    },
                  ].map((perm) => (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {perm.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {perm.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={perm.value}
                          onChange={(e) => perm.set(e.target.checked)}
                        />
                        <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary peer-disabled:opacity-60 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Change Password (optional) */}
            <div className="space-y-4 border-t border-border pt-5">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Change Password
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground"></p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background pr-12 pl-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background pr-12 pl-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
