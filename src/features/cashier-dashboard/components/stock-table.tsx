"use client"

import { useState, useMemo } from "react"
import { Search, Download, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { getStockStatus } from "@/lib/staff-utils"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/cashier"

const ITEMS_PER_PAGE = 5

export function StockTable({ products, isLoading }: { products: Product[]; isLoading?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)

  // Unique categories for the dropdown filter
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [products])

  // Filtered dataset
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCat = categoryFilter === "All" || p.category === categoryFilter

      const status = getStockStatus(p)
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "In Stock" && status === "in-stock") ||
        (statusFilter === "Low Stock" && status === "low-stock") ||
        (statusFilter === "Out of Stock" && status === "out-of-stock")

      return matchesSearch && matchesCat && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  // Pagination calculations
  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1
  const safePage = Math.min(currentPage, totalPages)

  const paginatedProducts = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, safePage])

  const handleExport = () => {
    alert("Exporting inventory log as CSV...")
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
      {/* Search & Filters Action Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Table Scrollport */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reorder Level</th>
              <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-200 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-12 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : (
              paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
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
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      isOut && "bg-red-50/20",
                      isLow && "bg-amber-50/10"
                    )}
                  >
                    {/* Product visual pill */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200/50 flex items-center justify-center">
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400 opacity-40" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-xs font-medium text-slate-600">{p.category}</td>

                    {/* Quantity */}
                    <td className="p-4 text-sm font-mono font-bold text-slate-700">
                      {p.stock} {p.unit}s
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs border",
                          isOut
                            ? "bg-red-50 text-red-700 border-red-200"
                            : isLow
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                    </td>

                    {/* Reorder Threshold */}
                    <td className="p-4 text-xs font-mono text-slate-500">
                      {p.reorderLevel} {p.unit}s
                    </td>

                    {/* Quick action buttons */}
                    <td className="p-4 text-right">
                      {isOut || isLow ? (
                        <button
                          onClick={() => alert(`Ordering stock replacement for SKU: ${p.sku}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-2xs"
                        >
                          Reorder Now
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Viewing details of SKU: ${p.sku}`)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between mt-auto">
        <p className="text-xs text-slate-400 font-medium font-mono">
          Showing {Math.min(totalItems, (safePage - 1) * ITEMS_PER_PAGE + 1)}-
          {Math.min(totalItems, safePage * ITEMS_PER_PAGE)} of {totalItems} items
        </p>

        <div className="flex items-center gap-1.5">
          <button
            disabled={safePage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-bold text-slate-600 px-2 font-mono">
            Page {safePage} of {totalPages}
          </span>

          <button
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
