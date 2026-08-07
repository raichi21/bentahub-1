"use client"

import { useState, useEffect, useCallback } from "react"
import { PickupTable, KPICard } from "@/features/admin-dashboard"
import { TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
import type { PickupApiData } from "@/types/admin"

export default function PickupsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PickupApiData | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [branch, setBranch] = useState("")
  const [, setError] = useState<string | null>(null)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)
      if (branch) params.set("branch", branch)

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
  }, [token, page, search, branch])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const metrics = data?.metrics
  const urgentCount = metrics?.urgentCount ?? 0

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  const handleBranchChange = (fBranchId: string) => {
    setBranch(fBranchId)
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
    const tableRows = data.pickups.map((p) => [
      p.displayId, p.customerName, p.branch, String(p.itemsCount),
      p.pickupDeadline ?? "", p.status,
    ])
    exportTableAsPdf({
      title: "Pickup Orders Report",
      metrics: [
        { label: "Total Orders", value: String(data.metrics.total) },
        { label: "Completed", value: String(data.metrics.completed) },
        { label: "Pending", value: String(data.metrics.pending) },
        { label: "Delayed", value: String(data.metrics.delayed) },
      ],
      headers: ["Order ID", "Customer", "Branch", "Items", "Scheduled Date", "Status"],
      rows: tableRows,
      filename: `pickups-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
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
        branch={branch}
        onPageChange={setPage}
        onSearch={handleSearch}
        onBranchChange={handleBranchChange}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        onConfirm={handleConfirm}
        loading={isLoading}
      />
    </div>
  )
}
