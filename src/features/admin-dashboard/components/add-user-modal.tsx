"use client"

import React, { useState, useEffect } from "react"
import { UserPlus, X, Eye, EyeOff, Loader2 } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSuccess: () => void
}

export function AddUserModal({
  isOpen,
  onClose,
  token,
  onSuccess,
}: AddUserModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("cashier")
  const [branch, setBranch] = useState("")
  const [canManageUnits, setCanManageUnits] = useState(false)
  const [canManageCategories, setCanManageCategories] = useState(false)
  const [canManageProducts, setCanManageProducts] = useState(false)
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen || !token) return
    fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d)
          ? d
          : d.data && Array.isArray(d.data)
            ? d.data
            : []
        setBranches(list)
        if (list.length > 0) setBranch(list[0].name)
      })
      .catch(() => {})
  }, [isOpen, token])

  if (!isOpen) return null

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
    } else if (!branch) {
      setBranch(branches[0]?.name || "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: name,
          email,
          password,
          role,
          branch,
          canManageUnits,
          canManageCategories,
          canManageProducts,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setRole("cashier")
        setBranch(branches[0]?.name || "")
        setCanManageUnits(false)
        setCanManageCategories(false)
        setCanManageProducts(false)
        onSuccess()
      } else {
        setError(data.message || "Failed to create user")
      }
    } catch {
      setError("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex animate-in items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="w-full max-w-lg animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Add New User</h2>
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
                  placeholder="e.g. Robert Fox"
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
                  placeholder={
                    role === "admin"
                      ? "youremail@gmail.com"
                      : "robert.fox@bentahub.com"
                  }
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  {role === "admin"
                    ? "Admins can use a personal email (e.g. Gmail) so password recovery reaches a real mailbox."
                    : "Cashier & Staff accounts require an @bentahub.com email."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background pr-12 pl-4 text-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                    required
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

              {role !== "cashier" && (
                <div className="border-t border-border pt-5">
                  <h3 className="text-sm font-bold text-foreground">
                    Role Permissions
                  </h3>
                  <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                    {role === "admin"
                      ? "Admins always have full management access."
                      : "Grant management access to the product management center."}
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
                            disabled={role === "admin"}
                          />
                          <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary peer-disabled:opacity-60 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              Add User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
