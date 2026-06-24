"use client"

import { useState } from "react"
import { MapPin, ChevronDown, Grid3X3, List } from "lucide-react"

interface CatalogToolbarProps {
  showingFrom: number
  showingTo: number
  totalProducts: number
}

export function CatalogToolbar({ showingFrom, showingTo, totalProducts }: CatalogToolbarProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="bg-muted border-b border-border px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Branch Selector */}
      <button
        onClick={() => {}}
        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span>Branch: Santa Maria Bulacan</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Right side: Count & View Toggle */}
      <div className="flex items-center justify-between sm:justify-end gap-4">
        <span className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{showingFrom}</span>-
          <span className="font-medium text-foreground">{showingTo}</span> of <span className="font-medium text-foreground">{totalProducts}</span> products
        </span>

        <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title="Grid View"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
