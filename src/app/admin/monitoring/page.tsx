"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { InventoryStatusTable, KPICard } from "@/features/admin-dashboard"
import { Package, AlertTriangle, Download, FileSpreadsheet, FileText, Clock, ExternalLink } from "lucide-react"
import type { MonitoringData, InventoryStatusItem, ExpiringItemData } from "@/types/admin"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

export default function MonitoringPage() {
  // ── All hooks must be before any early return ──
  const { token, isLoading: authLoading, isAuthenticated } = useAuth()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [exportOpen, setExportOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [firstLoadDone, setFirstLoadDone] = useState(false)
  const [branchesFetched, setBranchesFetched] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Fetch monitoring data
  useEffect(() => {
    if (!token) return

    const params = selectedBranch !== "all" ? `?branchId=${selectedBranch}` : ""

    fetch(`/api/admin/monitoring${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
        }
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data)
          setError(null)
        } else {
          setError(json.message || "API returned success=false")
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setFetched(true)
        setFirstLoadDone(true)
      })
  }, [token, selectedBranch])

  // Fetch branches for filter dropdown
  useEffect(() => {
    if (branchesFetched) return
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBranches(json.data)
        }
      })
      .catch(() => {})
      .finally(() => setBranchesFetched(true))
  }, [branchesFetched])

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── Derived state ──
  const isLoading = authLoading || (!authLoading && token && !fetched && !error)

  // ── Helper functions ──
  function exportCSV() {
    if (!data) return
    const rows = data.inventoryStatus.map((i: InventoryStatusItem) =>
      [i.productName, i.category, i.totalQuantity, i.reorderLevel, i.status, i.lastUpdated].join(",")
    )
    const csv = ["Product,Category,Quantity,Reorder Level,Status,Last Updated", ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `monitoring-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.inventoryStatus.map((i: InventoryStatusItem) =>
      `<tr><td>${i.productName}</td><td>${i.category}</td><td>${i.totalQuantity}</td><td>${i.reorderLevel}</td><td>${i.status}</td><td>${new Date(i.lastUpdated).toLocaleDateString()}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Monitoring Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        p { color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f5f5f5; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; }
        .metrics { display: flex; gap: 24px; margin-bottom: 24px; }
        .metric { background: #f9f9f9; padding: 16px; border-radius: 8px; flex: 1; }
        .metric-label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
        .metric-value { font-size: 20px; font-weight: bold; }
      </style></head><body>
      <h1>Inventory Monitoring Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Stock Value</div><div class="metric-value">${data.metrics.totalStockValue.value}</div></div>
        <div class="metric"><div class="metric-label">Low Stock Items</div><div class="metric-value">${data.metrics.lowStockItems.value}</div></div>
        <div class="metric"><div class="metric-label">Pending Reservations</div><div class="metric-value">${data.metrics.pendingReservations.value}</div></div>
      </div>
      <table><thead><tr><th>Product</th><th>Category</th><th>Quantity</th><th>Reorder Level</th><th>Status</th><th>Last Updated</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
    setExportOpen(false)
  }

  // ── Render ──
  if (!authLoading && !token) {
    return (
      <div className="p-8 text-center max-w-7xl mx-auto w-full">
        <p className="text-sm text-red-500">Not authenticated. Auth state: loading={String(authLoading)}, hasToken={String(!!token)}, isAuth={String(isAuthenticated)}</p>
        <p className="text-sm text-red-500 mt-2">Try going to <a href="/login" className="underline">/login</a> to log in again.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-7xl mx-auto w-full">
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Total Stock Value"
          value={data?.metrics.totalStockValue.value ?? "₱0"}
          trend={data?.metrics.totalStockValue.trend ?? "0%"}
          trendType="up"
          icon={Package}
        />
        <KPICard
          title="Low Stock Items"
          value={`${data?.metrics.lowStockItems.value ?? 0} items`}
          trend={data?.metrics.lowStockItems.severity ?? "Normal"}
          trendType={data?.metrics.lowStockItems.severity === "Critical" ? "warning" : "up"}
          icon={AlertTriangle}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <label className="text-sm font-bold text-muted-foreground whitespace-nowrap" htmlFor="branch-select">
            Select Branch:
          </label>
          <select
            id="branch-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full md:w-64 rounded-lg border-border bg-background focus:ring-primary focus:border-primary text-sm p-2.5"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-2 px-6 py-2.5 bg-muted/50 hover:bg-muted rounded-lg border border-border text-sm font-bold transition-all w-full md:w-auto justify-center"
          >
            <Download className="h-[18px] w-[18px]" />
            Export Data
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <button
                onClick={exportCSV}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                Export as CSV (Excel)
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
              >
                <FileText className="h-4 w-4 text-red-600" />
                Export as PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expiring Items Section */}
      {data?.expiringItems && data.expiringItems.length > 0 && (
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-lg text-foreground">Expiring Soon</h4>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {data.expiringItems.length} {data.expiringItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <Link
              href="/admin/sales"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              View Details
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.expiringItems.map((item: ExpiringItemData, i: number) => {
                  const isUrgent = item.daysUntilExpiry <= 7
                  return (
                    <tr key={`${item.productId}-${i}`} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-foreground">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.branchName}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{item.batchNumber || "—"}</td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-xs font-mono",
                          isUrgent ? "text-red-600 font-bold" : "text-amber-600 font-bold"
                        )}>
                          {new Date(item.expiryDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          isUrgent
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {isUrgent ? `${item.daysUntilExpiry} days left` : `${item.daysUntilExpiry} days left`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <InventoryStatusTable data={data?.inventoryStatus ?? []} />
    </div>
  )
}
