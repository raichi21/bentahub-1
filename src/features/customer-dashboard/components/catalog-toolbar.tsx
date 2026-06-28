"use client"

import { Filter, Search, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CatalogToolbarProps {
  showingFrom: number
  showingTo: number
  totalProducts: number
  activeBranch: string
  onBranchChange: (branch: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
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
  searchQuery = "",
  onSearchChange = () => {},
}: CatalogToolbarProps) {
  return (
    <div className="bg-muted border-b border-border">
      <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Branch Filter + Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-primary shrink-0" />
            <select
              value={activeBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-44 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors cursor-pointer"
            >
              {BRANCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        {/* Right side: Count */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{showingFrom}</span>-
            <span className="font-medium text-foreground">{showingTo}</span> of <span className="font-medium text-foreground">{totalProducts}</span> products
          </span>
        </div>
      </div>
      {/* Pickup Hours Notice */}
      <div className="px-4 md:px-6 pb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
        <Clock className="h-3 w-3" />
        <span>Reserve now, pickup at branch until <strong>5:00 PM</strong> (8:00 AM - 5:00 PM)</span>
      </div>
    </div>
  )
}
