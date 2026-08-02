"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, Download, FileSpreadsheet, FileText } from "lucide-react"
import type { InventoryStatusItem } from "@/types/admin"

interface InventoryStatusTableProps {
  data: InventoryStatusItem[]
  branches?: { id: string; name: string }[]
  selectedBranch?: string
  onBranchChange?: (value: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
}

const ITEMS_PER_PAGE = 20

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" })
}

export function InventoryStatusTable({
  data,
  branches = [],
  selectedBranch = "all",
  onBranchChange,
  onExportCSV,
  onExportPDF,
}: InventoryStatusTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.branchName.toLowerCase().includes(q)
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
          <h4 className="font-bold text-lg text-foreground">Inventory</h4>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product or category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setPage(1)
              onBranchChange?.(e.target.value)
            }}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all w-full md:w-auto justify-center"
            >
              <Download className="h-[18px] w-[18px]" />
              Export Data
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { onExportCSV?.(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Export as CSV (Excel)
                </button>
                <button
                  onClick={() => { onExportPDF?.(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4">Total Quantity</th>
              <th className="px-6 py-4">Reorder Level</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((item) => {
              const statusColor = {
                "In Stock": "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                "Low Stock": "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                Critical: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              }[item.status]

              return (
                <tr key={`${item.productId}-${item.branchId}`} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{item.productName}</td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{item.category}</td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{item.branchName}</td>
                  <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">{item.totalQuantity}</td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{item.reorderLevel}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-sm text-foreground">{formatDate(item.lastUpdated)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {filtered.length} of {data.length} PRODUCTS
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
