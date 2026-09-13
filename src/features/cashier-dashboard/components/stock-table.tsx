"use client"

import { useState, useMemo } from "react"
import { Search, Package, Bell, Clock } from "lucide-react"
import {
  getStockStatus,
  getExpiryDays,
  formatExpiryDate,
  isExpiringSoon,
} from "@/lib/staff-utils"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type { Product } from "@/types/cashier"

const ITEMS_PER_PAGE = 10

export function StockTable({
  products,
  isLoading,
}: {
  products: Product[]
  isLoading?: boolean
}) {
  const { token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [notifyingMap, setNotifyingMap] = useState<
    Record<string, "idle" | "sending" | "sent" | "error">
  >({})

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Search & Filters Action Bar */}
      <div className="flex flex-col items-center justify-between gap-4 border-b border-border bg-muted/20 p-4 md:flex-row md:p-6">
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

        {/* Filters */}
        <div className="flex w-full items-center gap-3 md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
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
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Expiring Soon">Expiring Soon (30d)</option>
          </select>
        </div>
      </div>

      {/* Main Table Scrollport */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 animate-pulse rounded bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
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
                    className={cn(
                      "transition-colors hover:bg-muted/10",
                      isOut && "bg-red-50/20",
                      isLow && "bg-amber-50/10"
                    )}
                  >
                    {/* Product visual pill */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-border/50 bg-muted">
                          {p.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground opacity-40" />
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

                    {/* Category */}
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.category}
                    </td>

                    {/* Quantity */}
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      {p.stock} {p.unit}
                    </td>

                    {/* Expiry Date */}
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

                    {/* Status Badge */}
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

                    {/* Reorder Threshold */}
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      {p.reorderLevel} {p.unit}
                    </td>

                    {/* Quick action buttons */}
                    <td className="px-6 py-4 text-right">
                      {isOut || isLow ? (
                        <button
                          onClick={async () => {
                            if (
                              notifyingMap[p.id] === "sent" ||
                              notifyingMap[p.id] === "sending"
                            )
                              return
                            setNotifyingMap((prev) => ({
                              ...prev,
                              [p.id]: "sending",
                            }))
                            try {
                              const res = await fetch(
                                "/api/cashier/notify-low-stock",
                                {
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
                                }
                              )
                              const json = await res.json()
                              if (json.success) {
                                setNotifyingMap((prev) => ({
                                  ...prev,
                                  [p.id]: "sent",
                                }))
                              } else {
                                setNotifyingMap((prev) => ({
                                  ...prev,
                                  [p.id]: "error",
                                }))
                              }
                            } catch {
                              setNotifyingMap((prev) => ({
                                ...prev,
                                [p.id]: "error",
                              }))
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-3 py-1 text-[10px] font-bold shadow-2xs transition-colors",
                            notifyingMap[p.id] === "sent"
                              ? "cursor-default border border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          )}
                        >
                          <Bell className="h-3 w-3" />
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
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-auto flex items-center justify-between border-t border-border bg-muted/5 px-4 py-3 md:px-6 md:py-4">
        <p className="font-mono text-xs font-medium text-muted-foreground">
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
