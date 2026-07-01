"use client"

import { useState, useRef } from "react"
import { Search, SlidersHorizontal, CheckCircle2, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { ConfirmPickupModal } from "./confirm-pickup-modal"
import { PickupDetailsModal } from "./pickup-details-modal"
import type { PickupRowData } from "@/types/admin"

interface PickupTableProps {
  pickups: PickupRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  onConfirm: (orderId: string) => Promise<boolean>
  loading: boolean
}

export function PickupTable({ pickups, totalCount, page, pageSize, onPageChange, onSearch, onConfirm, loading }: PickupTableProps) {
  const [confirmingPickup, setConfirmingPickup] = useState<PickupRowData | null>(null)
  const [viewingPickup, setViewingPickup] = useState<PickupRowData | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const totalPages = Math.ceil(totalCount / pageSize)
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => onSearch(e.target.value), 300)
  }

  const statusStyles: Record<string, string> = {
    ready: "bg-accent/50 text-primary border border-primary/20",
    pending: "bg-muted text-muted-foreground border border-border",
    processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
  }

  const dotColors: Record<string, string> = {
    ready: "bg-primary animate-pulse",
    pending: "bg-muted-foreground",
    processing: "bg-amber-500",
    completed: "bg-emerald-500",
    cancelled: "bg-destructive",
  }

  const paginationButtons = () => {
    const maxVisible = 5
    const half = Math.floor(maxVisible / 2)
    let s = Math.max(1, page - half)
    let e = Math.min(totalPages, s + maxVisible - 1)
    if (e - s + 1 < maxVisible) s = Math.max(1, e - maxVisible + 1)
    const buttons: React.ReactNode[] = []

    if (s > 1) {
      buttons.push(
        <button key={1} onClick={() => onPageChange(1)} className="w-9 h-9 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted transition-colors font-bold text-xs">1</button>
      )
      if (s > 2) buttons.push(<span key="dots-s" className="px-1 text-muted-foreground text-xs">...</span>)
    }

    for (let i = s; i <= e; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-9 h-9 flex items-center justify-center rounded text-xs font-bold ${
            i === page ? "bg-primary text-primary-foreground shadow-sm" : "border border-border text-muted-foreground hover:bg-muted transition-colors"
          }`}
        >{i}</button>
      )
    }

    if (e < totalPages) {
      if (e < totalPages - 1) buttons.push(<span key="dots-e" className="px-1 text-muted-foreground text-xs">...</span>)
      buttons.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-9 h-9 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted transition-colors font-bold text-xs">{totalPages}</button>
      )
    }

    return buttons
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h4 className="text-base font-bold text-foreground">Pickup Orders</h4>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order ID or customer..."
                className="pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64 md:w-72 shadow-sm"
                onChange={handleSearchChange}
              />
            </div>
            <button disabled className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all opacity-50 cursor-not-allowed">
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && pickups.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading pickups...</div>
          ) : pickups.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No pickup orders found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Order ID</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Customer</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Branch</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold text-center">Items</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Scheduled Date</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 text-[11px] text-muted-foreground uppercase tracking-wider font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {pickups.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-primary font-semibold">{order.displayId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{order.customerName}</span>
                        <span className="text-muted-foreground text-xs">{order.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{order.branch}</td>
                    <td className="px-6 py-4 text-sm text-foreground text-center font-medium">{order.itemsCount} items</td>
                    <td className="px-6 py-4 text-sm text-foreground">{order.pickupDeadline || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] ${statusStyles[order.status] || ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[order.status] || ""}`} />
                        {order.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === "ready" && (
                          <button
                            onClick={() => setConfirmingPickup(order)}
                            className="p-2 border border-border hover:bg-primary/10 hover:border-primary text-primary rounded-lg transition-all"
                            title="Confirm Pickup"
                          >
                            <CheckCircle2 className="h-[18px] w-[18px]" />
                          </button>
                        )}
                        <button
                          onClick={() => setViewingPickup(order)}
                          className="p-2 border border-border hover:bg-muted text-muted-foreground rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-[18px] w-[18px]" />
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
          <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-muted/5">
            <p className="text-xs text-muted-foreground">Showing {start}–{end} of {totalCount} orders</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-9 h-9 flex items-center justify-center border border-border rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="h-[18px] w-[18px]" />
              </button>
              {paginationButtons()}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="w-9 h-9 flex items-center justify-center border border-border rounded text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmPickupModal
        key={confirmingPickup ? `confirm-${confirmingPickup.id}` : "confirm-closed"}
        isOpen={confirmingPickup !== null}
        onClose={() => setConfirmingPickup(null)}
        order={confirmingPickup}
        onConfirm={onConfirm}
      />

      <PickupDetailsModal
        key={viewingPickup ? `details-${viewingPickup.id}` : "details-closed"}
        isOpen={viewingPickup !== null}
        onClose={() => setViewingPickup(null)}
        order={viewingPickup}
      />
    </>
  )
}
