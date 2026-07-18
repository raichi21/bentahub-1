"use client"

import { useState, useMemo } from "react"
import { Search, Package, Bell } from "lucide-react"
import { getStockStatus } from "@/lib/staff-utils"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/cashier"

const ITEMS_PER_PAGE = 5

export function StockTable({ products, isLoading }: { products: Product[]; isLoading?: boolean }) {
  const { token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [notifyingMap, setNotifyingMap] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({})

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

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
      {/* Search & Filters Action Bar */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
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
            className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
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
            className="px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

        </div>
      </div>

      {/* Main Table Scrollport */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantity</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reorder Level</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 w-20 bg-muted rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-5 w-20 bg-muted rounded-full animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-12 bg-muted rounded animate-pulse" /></td>
                  <td className="p-4"><div className="h-4 w-16 bg-muted rounded animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : (
              paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
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
                      "hover:bg-muted/50 transition-colors",
                      isOut && "bg-red-50/20",
                      isLow && "bg-amber-50/10"
                    )}
                  >
                    {/* Product visual pill */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden border border-border/50 flex items-center justify-center">
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground opacity-40" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-card-foreground">{p.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-xs font-medium text-muted-foreground">{p.category}</td>

                    {/* Quantity */}
                    <td className="p-4 text-sm font-mono font-bold text-card-foreground">
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
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {p.reorderLevel} {p.unit}s
                    </td>

                    {/* Quick action buttons */}
                    <td className="p-4 text-right">
                      {isOut || isLow ? (
                        <button
                          onClick={async () => {
                            if (notifyingMap[p.id] === "sent" || notifyingMap[p.id] === "sending") return
                            setNotifyingMap((prev) => ({ ...prev, [p.id]: "sending" }))
                            try {
                              const res = await fetch("/api/cashier/notify-low-stock", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  productId: p.id,
                                  productName: p.name,
                                  sku: p.sku,
                                }),
                              })
                              const json = await res.json()
                              if (json.success) {
                                setNotifyingMap((prev) => ({ ...prev, [p.id]: "sent" }))
                              } else {
                                setNotifyingMap((prev) => ({ ...prev, [p.id]: "error" }))
                              }
                            } catch {
                              setNotifyingMap((prev) => ({ ...prev, [p.id]: "error" }))
                            }
                          }}
                          className={cn(
                            "px-3 py-1 rounded text-[10px] font-bold transition-colors shadow-2xs inline-flex items-center gap-1",
                            notifyingMap[p.id] === "sent"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default"
                              : "bg-blue-600 text-white hover:bg-blue-700",
                          )}
                        >
                          <Bell className="w-3 h-3" />
                          {notifyingMap[p.id] === "sending"
                            ? "Notifying..."
                            : notifyingMap[p.id] === "sent"
                            ? "Notified"
                            : notifyingMap[p.id] === "error"
                            ? "Retry"
                            : "Notify Staff"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 bg-muted border-t border-border flex items-center justify-between mt-auto">
        <p className="text-xs text-muted-foreground font-medium font-mono">
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

          <span className="text-xs font-bold text-muted-foreground px-2 font-mono">
            Page {safePage} of {totalPages}
          </span>

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
