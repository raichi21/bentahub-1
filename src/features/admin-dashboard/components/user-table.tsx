"use client"

import { useState, useRef } from "react"
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react"
import { AddUserModal } from "./add-user-modal"
import { EditUserModal } from "./edit-user-modal"
import { DeleteUserModal } from "./delete-user-modal"
import type { UserRowData } from "@/types/admin"

interface UserTableProps {
  users: UserRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  onRefresh: () => void
  loading: boolean
  token: string | null
}

export function UserTable({
  users,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onRefresh,
  loading,
  token,
}: UserTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRowData | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRowData | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const roleStyles: Record<string, string> = {
    admin: "bg-primary/10 text-primary border border-primary/20",
    cashier:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    staff: "bg-muted/80 text-muted-foreground border border-border",
    customer:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  }

  const getPermissions = (u: UserRowData) => [
    { label: "Units", has: u.role === "admin" || u.canManageUnits },
    { label: "Categories", has: u.role === "admin" || u.canManageCategories },
    { label: "Products", has: u.role === "admin" || u.canManageProducts },
  ]

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "UN"

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
        <h4 className="text-lg font-bold text-foreground">User Management</h4>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              onChange={handleSearchChange}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-95 active:scale-[0.98] md:w-auto"
          >
            <Plus className="h-[18px] w-[18px]" />
            Add User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-[11px] font-bold tracking-widest uppercase">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4">Permissions</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Join Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={8}>
                  <div className="flex animate-pulse flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">
                      Loading users...
                    </p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={8}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">
                        No users found.
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try adjusting your search.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="group transition-colors hover:bg-primary/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {getInitials(u.fullName)}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {u.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${roleStyles[u.role] || "bg-muted text-muted-foreground"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1">
                      {getPermissions(u)
                        .filter((p) => p.has)
                        .map((p) => (
                          <span
                            key={p.label}
                            className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase"
                          >
                            {p.label}
                          </span>
                        ))}
                      {getPermissions(u).filter((p) => p.has).length === 0 && (
                        <span className="text-[10px] text-muted-foreground italic">
                          No permissions
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {u.branch || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                        u.isActive
                          ? "border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border border-destructive/20 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-destructive"}`}
                      />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm font-medium text-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role === "customer" ? (
                      <span className="text-[10px] text-muted-foreground italic">
                        —
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            Showing {users.length > 0 ? start : 0} to {end} of {totalCount}{" "}
            results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddUserModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        token={token}
        onSuccess={() => {
          setIsAddOpen(false)
          onRefresh()
        }}
      />
      <EditUserModal
        key={editingUser?.id || "none"}
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        token={token}
        onSuccess={() => {
          setEditingUser(null)
          onRefresh()
        }}
      />
      <DeleteUserModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        userId={deletingUser?.id || ""}
        userName={deletingUser?.fullName || ""}
        token={token}
        onSuccess={() => {
          setDeletingUser(null)
          onRefresh()
        }}
      />
    </section>
  )
}
