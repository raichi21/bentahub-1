"use client"

import { useState } from "react"
import { Search, Eye, FileX, Loader2 } from "lucide-react"
import type { ReservationRowData } from "@/types/admin"

interface ReservationTableProps {
  reservations: ReservationRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (query: string) => void
  onViewDetails: (reservation: ReservationRowData) => void
  loading: boolean
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ready: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
}

export function ReservationTable({
  reservations,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  onViewDetails,
  loading,
}: ReservationTableProps) {
  const [searchInput, setSearchInput] = useState("")
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/5">
        <h4 className="text-base font-bold text-foreground">All Reservations</h4>
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ID or Customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/10 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reservation ID</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Pickup Date</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={8}>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-20 text-center" colSpan={8}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <FileX className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No reservations found.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              reservations.map((r) => {
                const statusStyle = STATUS_STYLES[r.status] || "bg-muted text-muted-foreground"
                const pickupDisplay = r.pickupDeadline
                  ? new Date(r.pickupDeadline).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"

                return (
                  <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-primary font-bold">{r.displayId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {r.customerInitials}
                        </div>
                        <span className="text-sm font-medium text-foreground">{r.customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{r.branch}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{r.itemsCount} {r.itemsCount === 1 ? "Item" : "Items"}</td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      ₱{parseFloat(r.totalAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{pickupDisplay}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onViewDetails(r)} className="p-1 hover:bg-muted rounded text-primary transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-muted/5 border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground font-medium">
          Showing {reservations.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
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
    </section>
  )
}
