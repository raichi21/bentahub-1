"use client"

import { useState } from "react"
import { Search, Download } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface SalesFiltersProps {
  branches: BranchOption[]
  onFilter: (branchId: string, dateFrom: string, dateTo: string) => void
  branchId: string
  dateFrom: string
  dateTo: string
  onExport?: () => void
}

export function SalesFilters({ branches, onFilter, branchId, dateFrom, dateTo, onExport }: SalesFiltersProps) {
  const [localBranch, setLocalBranch] = useState(branchId)
  const [localFrom, setLocalFrom] = useState(dateFrom)
  const [localTo, setLocalTo] = useState(dateTo)

  const handleApply = () => {
    onFilter(localBranch, localFrom, localTo)
  }

  return (
    <section className="col-span-1 md:col-span-12 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-3 bg-muted/20 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Sales Filters</h3>
      </div>
      <div className="p-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date From</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date To</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
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
          aria-label="Export transactions"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </section>
  )
}
