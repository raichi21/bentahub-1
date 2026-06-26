"use client"

import { MapPin } from "lucide-react"

interface CatalogToolbarProps {
  showingFrom: number
  showingTo: number
  totalProducts: number
  branch?: string
}

export function CatalogToolbar({ showingFrom, showingTo, totalProducts, branch }: CatalogToolbarProps) {
  return (
    <div className="bg-muted border-b border-border px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Branch */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span>{branch ? `Branch: ${branch}` : "All Branches"}</span>
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
