"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Search, ChevronLeft, ChevronRight, Edit3, Plus, Package } from "lucide-react"
import type { Product } from "@/types/cashier"
import { getStockStatus } from "@/lib/staff-utils"
import { QuickStockModal } from "./quick-stock-modal"
import { AddStockModal } from "./add-stock-modal"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 6

interface InventoryUpdateTableProps {
  products: Product[]
  onStockUpdate: (productId: string, newStock: number, newReorderLevel: number) => void
  onAddProduct?: (product: { name: string; sku?: string; category: string; stock: number; reorderLevel: number; unit: string; price: number; image?: string }) => void
  savingId?: string | null
}

export function InventoryUpdateTable({ products: initialProducts, onStockUpdate, onAddProduct, savingId }: InventoryUpdateTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const categories = useMemo(() => {
    const set = new Set(initialProducts.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [initialProducts])

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat = categoryFilter === "All" || p.category === categoryFilter
      const status = getStockStatus(p)
      const matchesStatus = statusFilter === "All" || (statusFilter === "In Stock" && status === "in-stock") || (statusFilter === "Low Stock" && status === "low-stock") || (statusFilter === "Out of Stock" && status === "out-of-stock")
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

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
      <QuickStockModal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} onSave={onStockUpdate} />
      <AddStockModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={(p) => onAddProduct?.(p)} />

      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            {categories.map((cat) => (<option key={cat} value={cat}>Category: {cat}</option>))}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/95 transition-colors shadow-xs"
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
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reorder Level</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No stock records matched your query</td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const status = getStockStatus(p)
                const isOut = status === "out-of-stock"
                const isLow = status === "low-stock"
                return (
                  <tr key={p.id} className={cn("hover:bg-muted/20 transition-colors", isOut && "bg-red-50/20", isLow && "bg-amber-50/10")}>
                    <td className="p-4">
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
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-medium text-muted-foreground">{p.category}</td>
                    <td className="p-4 text-sm font-mono font-bold text-foreground">{p.stock} {p.unit}s</td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                        isOut ? "bg-red-50 text-red-700 border-red-200" : isLow ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">{p.reorderLevel} {p.unit}s</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingProduct(p)}
                        disabled={savingId === p.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/95 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        {savingId === p.id ? "Saving..." : "Edit Stock"}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between mt-auto">
        <p className="text-xs text-muted-foreground font-medium font-mono">
          Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems} items
        </p>
        <div className="flex items-center gap-1.5">
          <button disabled={safePage === 1} onClick={() => setCurrentPage((c) => c - 1)} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-muted-foreground px-2 font-mono">Page {safePage} of {totalPages}</span>
          <button disabled={safePage === totalPages} onClick={() => setCurrentPage((c) => c + 1)} className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
