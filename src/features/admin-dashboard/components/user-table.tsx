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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const roleStyles: Record<string, string> = {
    admin: "bg-primary/10 text-primary border border-primary/20",
    cashier: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    staff: "bg-muted/80 text-muted-foreground border border-border",
    customer: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "UN"

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <h4 className="font-bold text-lg text-foreground">User Management</h4>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all w-full md:w-auto"
          >
            <Plus className="h-[18px] w-[18px]" />
            Add User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/40 border-b border-border">
            <tr className="text-[11px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-center">Role</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Join Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={7}>
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="font-bold text-foreground">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={7}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No users found.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {getInitials(u.fullName)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${roleStyles[u.role] || "bg-muted text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">
                    {u.branch || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isActive
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-destructive"}`} />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-medium text-sm text-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    {u.role === "customer" ? (
                      <span className="text-[10px] text-muted-foreground italic">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            Showing {users.length > 0 ? start : 0} to {end} of {totalCount} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        onSuccess={() => { setIsAddOpen(false); onRefresh() }}
      />
      <EditUserModal
        key={editingUser?.id || "none"}
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        token={token}
        onSuccess={() => { setEditingUser(null); onRefresh() }}
      />
      <DeleteUserModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        userId={deletingUser?.id || ""}
        userName={deletingUser?.fullName || ""}
        token={token}
        onSuccess={() => { setDeletingUser(null); onRefresh() }}
      />
    </section>
  )
}
