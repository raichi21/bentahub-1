"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, Download, FileSpreadsheet, FileText } from "lucide-react"
import type { InventoryStatusItem } from "@/types/admin"
import { DateRangeFilter } from "./date-range-filter"

interface InventoryStatusTableProps {
  data: InventoryStatusItem[]
  branches?: { id: string; name: string }[]
  selectedBranch?: string
  onBranchChange?: (value: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
  dateValue?: string
  onDateValueChange?: (value: string) => void
}

const ITEMS_PER_PAGE = 20

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-PH", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })
}

function expiryCell(item: InventoryStatusItem) {
  if (!item.earliestExpiry) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const days = Math.ceil(
    (new Date(item.earliestExpiry).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  )
  const color =
    days <= 7
      ? "text-red-600"
      : days <= 30
        ? "text-amber-600"
        : "text-foreground"
  return (
    <span
      className={`font-mono text-xs font-bold ${color}`}
      title={`${days} day${days === 1 ? "" : "s"} left`}
    >
      {formatDate(item.earliestExpiry)}
    </span>
  )
}

export function InventoryStatusTable({
  data,
  branches = [],
  selectedBranch = "all",
  onBranchChange,
  onExportCSV,
  onExportPDF,
  dateValue,
  onDateValueChange,
}: InventoryStatusTableProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
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
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <h4 className="text-lg font-bold text-foreground">Inventory</h4>
        </div>
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
            />
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setPage(1)
              onBranchChange?.(e.target.value)
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary md:w-auto"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <DateRangeFilter
            value={dateValue ?? ""}
            onChange={(v) => {
              setPage(1)
              onDateValueChange?.(v)
            }}
          />
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-bold transition-all hover:bg-muted md:w-auto"
            >
              <Download className="h-[18px] w-[18px]" />
              Export
            </button>
            {exportOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <button
                  onClick={() => {
                    onExportCSV?.()
                    setExportOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Export as CSV (Excel)
                </button>
                <button
                  onClick={() => {
                    onExportPDF?.()
                    setExportOpen(false)
                  }}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
        <table
          className="w-full border-collapse text-left"
          style={{ minWidth: 1020 }}
        >
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] font-bold tracking-widest uppercase">
              <th className="px-6 py-4 whitespace-nowrap">Product</th>
              <th className="px-6 py-4 whitespace-nowrap">Category</th>
              <th className="px-6 py-4 whitespace-nowrap">Branch</th>
              <th className="px-6 py-4 whitespace-nowrap">Total Quantity</th>
              <th className="px-6 py-4 whitespace-nowrap">Reorder Level</th>
              <th className="px-6 py-4 whitespace-nowrap">Nearest Expiry</th>
              <th className="px-6 py-4 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 whitespace-nowrap">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.map((item) => {
              const statusColor = {
                "In Stock":
                  "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                "Low Stock":
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                Critical:
                  "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              }[item.status]

              return (
                <tr
                  key={`${item.productId}-${item.branchId}`}
                  className="group cursor-pointer transition-colors hover:bg-primary/5"
                >
                  <td
                    className="max-w-[220px] truncate px-6 py-4 text-sm font-medium text-foreground"
                    title={item.productName}
                  >
                    {item.productName}
                  </td>
                  <td
                    className="max-w-[140px] truncate px-6 py-4 text-sm font-medium text-foreground"
                    title={item.category}
                  >
                    {item.category}
                  </td>
                  <td
                    className="max-w-[160px] truncate px-6 py-4 text-sm font-medium text-foreground"
                    title={item.branchName}
                  >
                    {item.branchName}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-medium whitespace-nowrap text-foreground">
                    {item.totalQuantity}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                    {item.reorderLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {expiryCell(item)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase ${statusColor}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                    {formatDate(item.lastUpdated)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            {filtered.length} of {data.length} PRODUCTS
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage <= 1}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
