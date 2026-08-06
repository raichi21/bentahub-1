"use client"

import { useState, useEffect, useCallback } from "react"
import { ReservationTable, ReservationDetailsModal, KPICard } from "@/features/admin-dashboard"
import { CalendarCheck, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
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
    const tableRows = data.reservations.map((r) => [
      r.displayId, r.customerName, r.branch, String(r.itemsCount),
      r.totalAmount, r.pickupDeadline ?? "", r.status,
    ])
    exportTableAsPdf({
      title: "Reservations Report",
      metrics: [
        { label: "Total Reservations", value: String(data.metrics.total) },
        { label: "Pending", value: String(data.metrics.pending) },
        { label: "Completed", value: String(data.metrics.completed) },
        { label: "Cancelled", value: String(data.metrics.cancelled) },
      ],
      headers: ["ID", "Customer", "Branch", "Items", "Total", "Pickup Date", "Status"],
      rows: tableRows,
      filename: `reservations-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
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
