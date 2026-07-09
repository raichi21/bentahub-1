"use client"

import { useState, useRef } from "react"
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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

  const totalPages = Math.ceil(totalCount / pageSize)
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

  const paginationButtons = () => {
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)
    let s = Math.max(1, page - half)
    const e = Math.min(totalPages, s + maxVisible - 1)
    if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1)
    const buttons: React.ReactNode[] = []

    if (s > 1) {
      buttons.push(
        <button key={1} onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-xs font-bold">1</button>
      )
      if (s > 2) buttons.push(<span key="dots-s" className="px-1 text-xs text-muted-foreground">...</span>)
    }

    for (let i = s; i <= e; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${
            i === page ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
          }`}
        >{i}</button>
      )
    }

    if (e < totalPages) {
      if (e < totalPages - 1) buttons.push(<span key="dots-e" className="px-1 text-xs text-muted-foreground">...</span>)
      buttons.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted text-xs font-bold">{totalPages}</button>
      )
    }

    return buttons
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-[536px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all text-sm h-12"
            placeholder="Search by name or email..."
            type="text"
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 h-12 px-8 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all"
          >
            <Plus className="h-[18px] w-[18px]" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No users found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/10 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Branch</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Join Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {getInitials(u.fullName)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight ${roleStyles[u.role] || "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {u.branch || "—"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                        u.isActive
                          ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-destructive"}`} />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > pageSize && (
          <div className="px-6 py-4 flex items-center justify-between bg-muted/5 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{start}–{end}</span> of{" "}
              <span className="font-bold text-foreground">{totalCount}</span> users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none h-8 w-8 flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {paginationButtons()}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none h-8 w-8 flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
    </div>
  )
}
