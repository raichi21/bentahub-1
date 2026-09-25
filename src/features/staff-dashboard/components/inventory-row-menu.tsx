"use client"

import { Edit3, Layers, MoreVertical } from "lucide-react"
import type { Product } from "@/types/cashier"

interface InventoryRowMenuProps {
  product: Product
  open: boolean
  onToggle: () => void
  onEdit: () => void
  onViewBatches: () => void
  saving: boolean
}

export function InventoryRowMenu({
  product: p,
  open,
  onToggle,
  onEdit,
  onViewBatches,
  saving,
}: InventoryRowMenuProps) {
  return (
    <div data-action-menu className="inline-flex">
      <button
        onClick={onToggle}
        className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute top-14 right-4 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            role="menuitem"
            onClick={onEdit}
            disabled={saving}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
            {saving ? "Saving..." : "Edit Stock"}
          </button>
          <div className="border-t border-border/40" />
          <button
            role="menuitem"
            onClick={onViewBatches}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            {(p.activeBatchCount ?? 0) > 0
              ? `${p.activeBatchCount ?? 0} ${(p.activeBatchCount ?? 0) === 1 ? "Batch" : "Batches"}`
              : "View Batches"}
          </button>
        </div>
      )}
    </div>
  )
}
