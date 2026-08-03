"use client"

import { useState, useRef, useEffect } from "react"
import { Search, CheckCircle2, Eye, Download, FileSpreadsheet, FileText } from "lucide-react"
import { ConfirmPickupModal } from "./confirm-pickup-modal"
import { PickupDetailsModal } from "./pickup-details-modal"
import type { PickupRowData } from "@/types/admin"

interface BranchOption {
  id: string
  name: string
}

interface PickupTableProps {
  pickups: PickupRowData[]
  totalCount: number
  page: number
  pageSize: number
  branches: BranchOption[]
  branch: string
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  onBranchChange: (branchId: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
  onConfirm: (orderId: string) => Promise<boolean>
  loading: boolean
}

export function PickupTable({ pickups, totalCount, page, pageSize, branches, branch, onPageChange, onSearch, onBranchChange, onExportCSV, onExportPDF, onConfirm, loading }: PickupTableProps) {
  const [confirmingPickup, setConfirmingPickup] = useState<PickupRowData | null>(null)
  const [viewingPickup, setViewingPickup] = useState<PickupRowData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
          <h4 className="font-bold text-lg text-foreground">Pickup Orders</h4>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order ID or customer..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
                onChange={handleSearchChange}
              />
            </div>
            <select
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all w-full md:w-auto justify-center"
              >
                <Download className="h-[18px] w-[18px]" />
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { onExportCSV?.(); setExportOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export as CSV (Excel)
                  </button>
                  <button
                    onClick={() => { onExportPDF?.(); setExportOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
                  >
                    <FileText className="h-4 w-4 text-red-600" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
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
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Order ID</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Customer</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Branch</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-center">Items</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Scheduled Date</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {pickups.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{order.displayId}</td>
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
                      <div className="flex items-center gap-2">
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
                          className="p-1 hover:bg-muted rounded text-primary transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
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
            <p className="text-xs text-muted-foreground font-medium">
              Showing {start} to {end} of {totalCount} entries
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
      </section>

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
