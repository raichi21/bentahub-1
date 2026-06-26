"use client"

import { Filter } from "lucide-react"

interface CatalogToolbarProps {
  showingFrom: number
  showingTo: number
  totalProducts: number
  activeBranch: string
  onBranchChange: (branch: string) => void
}

const BRANCHES = [
  "Lourdes Main Branch",
  "Lourdes Second Branch",
  "Lourdes Third Branch",
]

export function CatalogToolbar({
  showingFrom,
  showingTo,
  totalProducts,
  activeBranch,
  onBranchChange,
}: CatalogToolbarProps) {
  return (
    <div className="bg-muted border-b border-border px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Branch Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-primary shrink-0" />
          <select
          value={activeBranch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="w-56 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors cursor-pointer"
        >
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Right side: Count */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{showingFrom}</span>-
          <span className="font-medium text-foreground">{showingTo}</span> of <span className="font-medium text-foreground">{totalProducts}</span> products
        </span>
      </div>
    </div>
  )
}
