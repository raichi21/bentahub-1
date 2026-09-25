"use client"

import { Plus } from "lucide-react"
import { TableSearchInput } from "@/components/data-table"

interface InventoryToolbarProps {
  categories: string[]
  categoryFilter: string
  onCategoryChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  onAdd: () => void
  onSearch: (query: string) => void
}

export function InventoryToolbar({
  categories,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  onAdd,
  onSearch,
}: InventoryToolbarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
      <h4 className="text-lg font-bold text-foreground">Inventory Stock</h4>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <TableSearchInput
          placeholder="Search by product name, SKU, or barcode..."
          debounceMs={0}
          onSearch={onSearch}
        />
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-primary"
        >
          <option value="All">All Categories</option>
          {categories
            .filter((cat) => cat !== "All")
            .map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
        >
          <option value="All">Status: All</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Expiring Soon">Expiring Soon (30d)</option>
        </select>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/95"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Stock
        </button>
      </div>
    </div>
  )
}
