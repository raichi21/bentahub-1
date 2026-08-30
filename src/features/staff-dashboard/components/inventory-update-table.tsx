"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import { Search, Edit3, Plus, Package, Clock, Layers, MoreVertical } from "lucide-react"
import type { Product } from "@/types/cashier"
import { getStockStatus, getExpiryDays, formatExpiryDate, isExpiringSoon } from "@/lib/staff-utils"
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
  onStockUpdate: (productId: string, newStock: number, newReorderLevel: number, batchInfo?: BatchInfo) => void
  onAddProduct?: (product: AddProductData) => void
  savingId?: string | null
}

export function InventoryUpdateTable({ products: initialProducts, onStockUpdate, onAddProduct, savingId }: InventoryUpdateTableProps) {
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
  const menuRef = useRef<HTMLDivElement | null>(null)

  const categories = useMemo(() => {
    const set = new Set(initialProducts.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [initialProducts])

  const productCategories = useMemo(() => {
    return Array.from(new Set(initialProducts.map((p) => p.category)))
  }, [initialProducts])

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat = categoryFilter === "All" || p.category === categoryFilter
      const status = getStockStatus(p)
      const expiringSoon = isExpiringSoon(p.nearestExpiry)
      let matchesStatus = false
      if (statusFilter === "All") matchesStatus = true
      else if (statusFilter === "In Stock" && status === "in-stock") matchesStatus = true
      else if (statusFilter === "Low Stock" && status === "low-stock") matchesStatus = true
      else if (statusFilter === "Out of Stock" && status === "out-of-stock") matchesStatus = true
      else if (statusFilter === "Expiring Soon" && expiringSoon) matchesStatus = true
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
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      const timer = setTimeout(() => setHighlightedSku(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedSku, paginatedProducts])

  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
      <QuickStockModal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} onSave={onStockUpdate} />
      <ProductBatchesModal isOpen={!!batchProduct} onClose={() => setBatchProduct(null)} product={batchProduct} />
      {showAddModal && (
        <AddStockModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={(p) => onAddProduct?.(p)} categories={productCategories} />
      )}

      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <h4 className="font-bold text-lg text-foreground">Inventory Stock</h4>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none">
            {categories.map((cat) => (<option key={cat} value={cat}>Category: {cat}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none">
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon (30d)</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors shadow-xs justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stock
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/10 border-b border-border">
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Product</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Category</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Quantity</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Expiry</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Status</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Reorder Level</th>
              <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">No stock records matched your query</td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const status = getStockStatus(p)
                const isOut = status === "out-of-stock"
                const isLow = status === "low-stock"
                return (
                  <tr key={p.id} ref={highlightedSku === p.sku ? highlightRef : undefined} className={cn("hover:bg-muted/10 transition-colors", isOut && "bg-red-50/20", isLow && "bg-amber-50/10", highlightedSku === p.sku && "ring-2 ring-primary ring-inset bg-primary/5")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden border border-border/50 flex items-center justify-center">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground opacity-50" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{p.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">SKU: {p.sku}</p>
                          {p.barcode && <p className="text-[10px] font-mono text-muted-foreground">Barcode: {p.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{p.category}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-foreground">{p.stock} {p.unit}s</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const days = getExpiryDays(p.nearestExpiry)
                        const formatted = formatExpiryDate(p.nearestExpiry)
                        if (!days || !formatted) return <span className="text-xs text-muted-foreground">—</span>
                        const isUrgent = days <= 7
                        const isWarning = days <= 30
                        return (
                          <div className="flex items-center gap-1.5">
                            <Clock className={cn("w-3.5 h-3.5", isUrgent ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground")} />
                            <span className={cn("text-xs font-mono", isUrgent ? "text-red-600 font-bold" : isWarning ? "text-amber-600 font-bold" : "text-muted-foreground")}>
                              {formatted}
                              {isUrgent ? ` (${days}d)` : isWarning ? ` (${days}d)` : ""}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] uppercase border",
                        isOut ? "bg-red-50 text-red-700 border-red-200" : isLow ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500")} />
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.reorderLevel} {p.unit}s</td>
                    <td className="px-6 py-4 text-right relative">
                      <div ref={menuRef} className="inline-flex">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          aria-label="Actions"
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === p.id}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === p.id && (
                          <div
                            className="absolute right-4 top-14 z-20 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                            role="menu"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              role="menuitem"
                              onClick={() => { setEditingProduct(p); setOpenMenuId(null) }}
                              disabled={savingId === p.id}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                              {savingId === p.id ? "Saving..." : "Edit Stock"}
                            </button>
                            <div className="border-t border-border/40" />
                            <button
                              role="menuitem"
                              onClick={() => { setBatchProduct(p); setOpenMenuId(null) }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                            >
                              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                              {(p.activeBatchCount ?? 0) > 0 ? `${p.activeBatchCount ?? 0} ${(p.activeBatchCount ?? 0) === 1 ? "Batch" : "Batches"}` : "View Batches"}
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

      <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/5 mt-auto">
        <p className="text-xs text-muted-foreground font-medium">
          Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)} to {Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground font-medium">Page {safePage} of {totalPages}</span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
