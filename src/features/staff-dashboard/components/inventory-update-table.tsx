"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Search,
  Edit3,
  Plus,
  Package,
  Clock,
  Layers,
  MoreVertical,
} from "lucide-react"
import type { Product } from "@/types/cashier"
import {
  getStockStatus,
  getExpiryDays,
  formatExpiryDate,
  isExpiringSoon,
} from "@/lib/staff-utils"
import { QuickStockModal } from "./quick-stock-modal"
import { AddStockModal } from "./add-stock-modal"
import { ProductBatchesModal } from "./product-batches-modal"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 6

interface AddProductData {
  name: string
  sku?: string
  barcode?: string
  category: string
  stock: number
  reorderLevel: number
  unit: string
  price: number
  image?: string
  batchNumber?: string
  expiryDate?: string
  supplier?: string
}

interface BatchInfo {
  batchNumber?: string
  expiryDate?: string
  supplier?: string
}

interface InventoryUpdateTableProps {
  products: Product[]
  onStockUpdate: (
    productId: string,
    newStock: number,
    newReorderLevel: number,
    batchInfo?: BatchInfo
  ) => void
  onAddProduct?: (product: AddProductData) => void
  savingId?: string | null
  categories?: string[]
  units?: string[]
}

export function InventoryUpdateTable({
  products: initialProducts,
  onStockUpdate,
  onAddProduct,
  savingId,
  categories: masterCategories,
  units,
}: InventoryUpdateTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [batchProduct, setBatchProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [highlightedSku, setHighlightedSku] = useState<string | null>(null)
  const highlightRef = useRef<HTMLTableRowElement | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set(initialProducts.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [initialProducts])

  const productCategories = useMemo(() => {
    return Array.from(new Set(initialProducts.map((p) => p.category)))
  }, [initialProducts])

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat =
        categoryFilter === "All" || p.category === categoryFilter
      const status = getStockStatus(p)
      const expiringSoon = isExpiringSoon(p.nearestExpiry)
      let matchesStatus = false
      if (statusFilter === "All") matchesStatus = true
      else if (statusFilter === "In Stock" && status === "in-stock")
        matchesStatus = true
      else if (statusFilter === "Low Stock" && status === "low-stock")
        matchesStatus = true
      else if (statusFilter === "Out of Stock" && status === "out-of-stock")
        matchesStatus = true
      else if (statusFilter === "Expiring Soon" && expiringSoon)
        matchesStatus = true
      return matchesSearch && matchesCat && matchesStatus
    })
  }, [searchQuery, categoryFilter, statusFilter, initialProducts])

  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const safePage = Math.min(currentPage, totalPages)
  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, safePage])

  useEffect(() => {
    if (highlightedSku && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
      const timer = setTimeout(() => setHighlightedSku(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedSku, paginatedProducts])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && !target.closest("[data-action-menu]")) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <QuickStockModal
        key={editingProduct?.id ?? "none"}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSave={onStockUpdate}
      />
      <ProductBatchesModal
        isOpen={!!batchProduct}
        onClose={() => setBatchProduct(null)}
        product={batchProduct}
      />
      {showAddModal && (
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(p) => onAddProduct?.(p)}
          categories={masterCategories ?? productCategories}
          units={units ?? ["pcs"]}
        />
      )}

      <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
        <h4 className="text-lg font-bold text-foreground">Inventory Stock</h4>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon (30d)</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stock
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Product
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Category
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Quantity
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Expiry
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Reorder Level
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold tracking-wider uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-xs text-muted-foreground"
                >
                  No stock records matched your query
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const status = getStockStatus(p)
                const isOut = status === "out-of-stock"
                const isLow = status === "low-stock"
                return (
                  <tr
                    key={p.id}
                    ref={highlightedSku === p.sku ? highlightRef : undefined}
                    className={cn(
                      "transition-colors hover:bg-muted/10",
                      isOut && "bg-red-50/20",
                      isLow && "bg-amber-50/10",
                      highlightedSku === p.sku &&
                        "bg-primary/5 ring-2 ring-primary ring-inset"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-border/50 bg-muted">
                          {p.image ? (
                            <Image
                              src={p.image}
                              alt={p.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground opacity-50" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {p.name}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            SKU: {p.sku}
                          </p>
                          {p.barcode && (
                            <p className="font-mono text-[10px] text-muted-foreground">
                              Barcode: {p.barcode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.category}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const days = getExpiryDays(p.nearestExpiry)
                        const formatted = formatExpiryDate(p.nearestExpiry)
                        if (!days || !formatted)
                          return (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )
                        const isUrgent = days <= 7
                        const isWarning = days <= 30
                        return (
                          <div className="flex items-center gap-1.5">
                            <Clock
                              className={cn(
                                "h-3.5 w-3.5",
                                isUrgent
                                  ? "text-red-500"
                                  : isWarning
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                              )}
                            />
                            <span
                              className={cn(
                                "font-mono text-xs",
                                isUrgent
                                  ? "font-bold text-red-600"
                                  : isWarning
                                    ? "font-bold text-amber-600"
                                    : "text-muted-foreground"
                              )}
                            >
                              {formatted}
                              {isUrgent
                                ? ` (${days}d)`
                                : isWarning
                                  ? ` (${days}d)`
                                  : ""}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase",
                          isOut
                            ? "border-red-200 bg-red-50 text-red-700"
                            : isLow
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isOut
                              ? "bg-red-500"
                              : isLow
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          )}
                        />
                        {isOut
                          ? "Out of Stock"
                          : isLow
                            ? "Low Stock"
                            : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      {p.reorderLevel} {p.unit}
                    </td>
                    <td className="relative px-6 py-4 text-right">
                      <div data-action-menu className="inline-flex">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === p.id ? null : p.id)
                          }
                          className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                          aria-label="Actions"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === p.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === p.id && (
                          <div
                            className="absolute top-14 right-4 z-20 w-44 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                            role="menu"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                setEditingProduct(p)
                                setOpenMenuId(null)
                              }}
                              disabled={savingId === p.id}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              {savingId === p.id ? "Saving..." : "Edit Stock"}
                            </button>
                            <div className="border-t border-border/40" />
                            <button
                              role="menuitem"
                              onClick={() => {
                                setBatchProduct(p)
                                setOpenMenuId(null)
                              }}
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
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border bg-muted/5 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground">
          Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)} to{" "}
          {Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems}{" "}
          entries
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
