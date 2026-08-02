"use client"

import { useState, useEffect, useCallback } from "react"
import { ReservationTable, ReservationDetailsModal, KPICard } from "@/features/admin-dashboard"
import { CalendarCheck, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { ReservationApiData, ReservationRowData } from "@/types/admin"

export default function ReservationsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<ReservationApiData | null>(null)
  const [viewingReservation, setViewingReservation] = useState<ReservationRowData | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/reservations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const metrics = data?.metrics
  const total = metrics?.total ?? 0
  const successRate = total > 0 ? `${Math.round((metrics!.completed / total) * 100)}%` : "0%"
  const cancelRate = total > 0 ? `${Math.round((metrics!.cancelled / total) * 100)}%` : "0%"

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  function exportCSV() {
    const reservations = data?.reservations || []
    if (reservations.length === 0) return
    const rows = [
      ["Reservation ID", "Customer", "Branch", "Items", "Total", "Pickup Date", "Status"],
      ...reservations.map((r) => [
        r.displayId, r.customerName, r.branch, String(r.itemsCount),
        r.totalAmount, r.pickupDeadline ?? "", r.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservations-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.reservations.map((r) =>
      `<tr><td>${r.displayId}</td><td>${r.customerName}</td><td>${r.branch}</td><td>${r.itemsCount}</td><td>${r.totalAmount}</td><td>${r.pickupDeadline ?? ""}</td><td>${r.status}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Reservations Report</title>
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
      <h1>Reservations Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Reservations</div><div class="metric-value">${data.metrics.total}</div></div>
        <div class="metric"><div class="metric-label">Pending</div><div class="metric-value">${data.metrics.pending}</div></div>
        <div class="metric"><div class="metric-label">Completed</div><div class="metric-value">${data.metrics.completed}</div></div>
        <div class="metric"><div class="metric-label">Cancelled</div><div class="metric-value">${data.metrics.cancelled}</div></div>
      </div>
      <table><thead><tr><th>ID</th><th>Customer</th><th>Branch</th><th>Items</th><th>Total</th><th>Pickup Date</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Reservations"
          value={total.toLocaleString()}
          trend={metrics?.totalTrend ?? "0%"}
          trendType="up"
          icon={CalendarCheck}
        />
        <KPICard
          title="Pending"
          value={String(metrics?.pending ?? 0)}
          trend="Active"
          trendType="warning"
          icon={Clock}
        />
        <KPICard
          title="Completed"
          value={String(metrics?.completed ?? 0)}
          trend={`${successRate} Success`}
          trendType="up"
          icon={CheckCircle2}
        />
        <KPICard
          title="Cancelled"
          value={String(metrics?.cancelled ?? 0)}
          trend={cancelRate}
          trendType="down"
          icon={XCircle}
        />
      </div>
      <ReservationDetailsModal
        isOpen={!!viewingReservation}
        onClose={() => setViewingReservation(null)}
        order={viewingReservation}
      />
      <ReservationTable
        reservations={data?.reservations || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        onSearch={handleSearch}
        onViewDetails={(r) => setViewingReservation(r)}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
