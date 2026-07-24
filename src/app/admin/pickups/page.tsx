"use client"

import { useState, useEffect, useCallback } from "react"
import { PickupTable, KPICard } from "@/features/admin-dashboard"
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, Download, FileSpreadsheet, FileText } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { PickupApiData } from "@/types/admin"

export default function PickupsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PickupApiData | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [branch, setBranch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      if (branch) params.set("branch", branch)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/pickups?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        setError(null)
      } else {
        throw new Error(json.message || "API returned success=false")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, page, search, status, branch, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const metrics = data?.metrics
  const urgentCount = metrics?.urgentCount ?? 0

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  const handleFilter = (fBranch: string, fStatus: string, fDateFrom: string, fDateTo: string) => {
    setBranch(fBranch)
    setStatus(fStatus)
    setDateFrom(fDateFrom)
    setDateTo(fDateTo)
    setPage(1)
  }

  function exportCSV() {
    const pickups = data?.pickups || []
    if (pickups.length === 0) return
    const rows = [
      ["Order ID", "Customer", "Branch", "Items", "Scheduled Date", "Status"],
      ...pickups.map((p) => [
        p.displayId, p.customerName, p.branch, String(p.itemsCount),
        p.pickupDeadline ?? "", p.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pickups-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.pickups.map((p) =>
      `<tr><td>${p.displayId}</td><td>${p.customerName}</td><td>${p.branch}</td><td>${p.itemsCount}</td><td>${p.pickupDeadline ?? ""}</td><td>${p.status}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Pickup Orders Report</title>
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
      <h1>Pickup Orders Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Orders</div><div class="metric-value">${data.metrics.total}</div></div>
        <div class="metric"><div class="metric-label">Completed</div><div class="metric-value">${data.metrics.completed}</div></div>
        <div class="metric"><div class="metric-label">Pending</div><div class="metric-value">${data.metrics.pending}</div></div>
        <div class="metric"><div class="metric-label">Delayed</div><div class="metric-value">${data.metrics.delayed}</div></div>
      </div>
      <table><thead><tr><th>ID</th><th>Customer</th><th>Branch</th><th>Items</th><th>Scheduled Date</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  const handleConfirm = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/pickups/${orderId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        fetchData()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Orders"
          value={String(metrics?.total ?? 0)}
          trend={metrics?.totalTrend ?? "0%"}
          trendType="up"
          icon={TrendingUp}
        />
        <KPICard
          title="Completed"
          value={String(metrics?.completed ?? 0)}
          trend={metrics?.completedRate ?? "0%"}
          trendType="up"
          icon={CheckCircle2}
        />
        <KPICard
          title="Pending"
          value={String(metrics?.pending ?? 0)}
          trend={urgentCount > 0 ? `${urgentCount} urgent` : "Pending"}
          trendType="warning"
          icon={Clock}
        />
        <KPICard
          title="Delayed"
          value={String(metrics?.delayed ?? 0)}
          trend={(metrics?.delayed ?? 0) > 0 ? "Needs review" : "All clear"}
          trendType={(metrics?.delayed ?? 0) > 0 ? "down" : "up"}
          icon={AlertTriangle}
        />
      </div>
      <PickupTable
        pickups={data?.pickups || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        branches={data?.branches || []}
        status={status}
        branch={branch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPageChange={setPage}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        onConfirm={handleConfirm}
        loading={isLoading}
      />
    </div>
  )
}
