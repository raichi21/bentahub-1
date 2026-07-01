"use client"

import { useState } from "react"
import { Search, Download } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface ReservationFiltersProps {
  branches: BranchOption[]
  onFilter: (branch: string, status: string, dateFrom: string, dateTo: string) => void
  branch: string
  status: string
  dateFrom: string
  dateTo: string
  onExport?: () => void
}

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export function ReservationFilters({ branches, onFilter, branch, status, dateFrom, dateTo, onExport }: ReservationFiltersProps) {
  const [localBranch, setLocalBranch] = useState(branch)
  const [localStatus, setLocalStatus] = useState(status)
  const [localFrom, setLocalFrom] = useState(dateFrom)
  const [localTo, setLocalTo] = useState(dateTo)

  const handleApply = () => {
    onFilter(localBranch, localStatus, localFrom, localTo)
  }

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-3 bg-muted/20 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Filter Reservations</h3>
      </div>
      <div className="p-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Status</label>
          <select
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            value={localStatus}
            onChange={(e) => setLocalStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Branch</label>
          <select
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            value={localBranch}
            onChange={(e) => setLocalBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date From</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date To</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
          />
        </div>
        <button
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          aria-label="Apply filters"
        >
          <Search className="h-4 w-4" />
          Apply
        </button>
        <button
          onClick={onExport}
          className="bg-muted hover:bg-muted/80 text-foreground px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-border transition-all active:scale-95"
          aria-label="Export reservations"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </section>
  )
}
