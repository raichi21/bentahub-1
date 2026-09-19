"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  CheckCircle2,
  Eye,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
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

export function PickupTable({
  pickups,
  totalCount,
  page,
  pageSize,
  branches,
  branch,
  onPageChange,
  onSearch,
  onBranchChange,
  onExportCSV,
  onExportPDF,
  onConfirm,
  loading,
}: PickupTableProps) {
  const [confirmingPickup, setConfirmingPickup] =
    useState<PickupRowData | null>(null)
  const [viewingPickup, setViewingPickup] = useState<PickupRowData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
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
    processing:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    completed:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    cancelled:
      "bg-destructive/10 text-destructive border border-destructive/20",
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
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <h4 className="text-lg font-bold text-foreground">Pickup Orders</h4>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search order ID or customer..."
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
                onChange={handleSearchChange}
              />
            </div>
            <select
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-bold transition-all hover:bg-muted md:w-auto"
              >
                <Download className="h-[18px] w-[18px]" />
                Export
              </button>
              {exportOpen && (
                <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <button
                    onClick={() => {
                      onExportCSV?.()
                      setExportOpen(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export as CSV (Excel)
                  </button>
                  <button
                    onClick={() => {
                      onExportPDF?.()
                      setExportOpen(false)
                    }}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
            <div className="animate-pulse p-12 text-center text-sm text-muted-foreground">
              Loading pickups...
            </div>
          ) : pickups.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No pickup orders found.
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Branch
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold tracking-wider uppercase">
                    Items
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {pickups.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-muted/10"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      {order.displayId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customerEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {order.branch}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      {order.itemsCount} items
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {order.pickupDeadline || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold ${statusStyles[order.status] || ""}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${dotColors[order.status] || ""}`}
                        />
                        {order.statusDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {order.status === "ready" && (
                          <button
                            onClick={() => setConfirmingPickup(order)}
                            className="rounded-lg border border-border p-2 text-primary transition-all hover:border-primary hover:bg-primary/10"
                            title="Confirm Pickup"
                          >
                            <CheckCircle2 className="h-[18px] w-[18px]" />
                          </button>
                        )}
                        <button
                          onClick={() => setViewingPickup(order)}
                          className="rounded p-1 text-primary transition-colors hover:bg-muted"
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

        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
              Showing {start} to {end} of {totalCount} entries
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
      </section>

      <ConfirmPickupModal
        key={
          confirmingPickup ? `confirm-${confirmingPickup.id}` : "confirm-closed"
        }
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
