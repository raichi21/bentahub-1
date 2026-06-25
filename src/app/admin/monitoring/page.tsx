"use client"

import { useState, useEffect, useRef } from "react"
import { MonitoringMetrics, InventoryStatusTable, SystemAlerts } from "@/features/admin-dashboard"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import type { MonitoringData, InventoryStatusItem } from "@/types/admin"

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    fetch("/api/admin/monitoring")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setData(json.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <MonitoringMetrics data={data?.metrics ?? { totalStockValue: { value: "₱0", trend: "0%" }, lowStockItems: { value: 0, severity: "Normal" }, pendingReservations: { value: 0, todayCount: 0 } }} />

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
            {(data?.branches ?? []).map((b) => {
              const displayName = b.name
                .replace("Second", "2nd")
                .replace("Third", "3rd")
              return (
                <option key={b.id} value={b.id}>{displayName}</option>
              )
            })}
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

      <InventoryStatusTable data={data?.inventoryStatus ?? []} />

      <SystemAlerts data={data?.alerts ?? []} />
    </div>
  )
}
