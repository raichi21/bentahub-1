"use client"

import { Filter, Search, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface CategoryChip {
  name: string
  count: number
}

interface CatalogToolbarProps {
  showingFrom: number
  showingTo: number
  totalProducts: number
  activeBranch: string
  onBranchChange: (branch: string) => void
  /** Category filter options ("All Categories" when value is ""). */
  categories: CategoryChip[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  branches: string[]
}

export function CatalogToolbar({
  showingFrom,
  showingTo,
  totalProducts,
  activeBranch,
  onBranchChange,
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery = "",
  onSearchChange = () => {},
  branches,
}: CatalogToolbarProps) {
  return (
    <div className="border-b border-border bg-muted">
      <div className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        {/* Left: Branch + Category Filters + Search */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-primary" />
            <select
              value={activeBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-44 cursor-pointer rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground transition-colors focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <select
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-10 cursor-pointer rounded-lg border border-border bg-background px-4 text-sm text-foreground transition-colors outline-none focus:border-primary focus:ring-primary"
          >
            <option value="">All Products</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="relative min-w-[140px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="h-9 pl-10 text-sm"
            />
          </div>
        </div>

        {/* Right side: Count */}
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{showingFrom}</span>-
            <span className="font-medium text-foreground">{showingTo}</span> of{" "}
            <span className="font-medium text-foreground">{totalProducts}</span>{" "}
            products
          </span>
        </div>
      </div>
      {/* Pickup Hours Notice */}
      <div className="flex items-center gap-1.5 px-4 pb-2 text-[11px] text-muted-foreground/70 sm:px-6 lg:px-8">
        <Clock className="h-3 w-3" />
        <span>
          Reserve now, pickup at branch until <strong>5:00 PM</strong> (8:00 AM
          - 5:00 PM)
        </span>
      </div>
    </div>
  )
}
