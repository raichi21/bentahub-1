"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import type { InventoryStatusItem } from "@/types/admin"

interface InventoryStatusTableProps {
  data: InventoryStatusItem[]
}

const ITEMS_PER_PAGE = 20

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" })
}

export function InventoryStatusTable({ data }: InventoryStatusTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, safePage])

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <div className="flex items-center gap-4">
          <h4 className="font-bold text-lg text-foreground">Inventory Status Overview</h4>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
            {filtered.length} of {data.length} products
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product or category..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Total Quantity</th>
              <th className="px-6 py-4">Reorder Level</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((item) => {
              const statusColor = {
                Active: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                "Low Stock": "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                Critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              }[item.status]

              return (
                <tr key={item.productId} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 font-bold text-sm text-foreground">{item.productName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{item.category}</td>
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{item.totalQuantity}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{item.reorderLevel}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{formatDate(item.lastUpdated)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  p === safePage
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:bg-background"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="p-2 rounded-lg border border-border hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
