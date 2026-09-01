"use client"

import { useState, useEffect, useCallback } from "react"
import { KPICard, CashDrawerTable } from "@/features/admin-dashboard"
import type { CashDrawerRow } from "@/features/admin-dashboard/components/cash-drawer-table"
import { Wallet, BadgeCheck, Scale } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"

interface CashDrawerApiData {
  metrics: {
    openCount: number
    closedCount: number
    totalNetworkCash: number
    totalNetworkCashDisplay: string
    totalDiscrepancy: number
    totalDiscrepancyDisplay: string
  }
  sessions: CashDrawerRow[]
  branches: { id: string; name: string }[]
  cashiers: { id: string; name: string }[]
  totalCount: number
}

export default function CashDrawerPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<CashDrawerApiData | null>(null)
  const [branchId, setBranchId] = useState("")
  const [cashierId, setCashierId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)
      if (cashierId) params.set("cashierId", cashierId)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      const res = await fetch(`/api/admin/cash-drawer?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, branchId, cashierId, dateFrom, dateTo, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleBranchChange = (b: string) => { setBranchId(b); setPage(1) }
  const handleCashierChange = (c: string) => { setCashierId(c); setPage(1) }
  const handleDateChange = (from: string, to: string) => { setDateFrom(from); setDateTo(to); setPage(1) }

  function exportPDF() {
    if (!data) return
    const rows = data.sessions.map((s) => [
      s.displayId, s.branchName, s.cashierName, s.openedAtDisplay,
      s.closedAtDisplay ?? "", s.startingCashDisplay, s.expectedEndingCashDisplay,
      s.actualEndingCashDisplay, s.netCashImpactDisplay, s.diffDisplay, s.statusDisplay,
    ])
    exportTableAsPdf({
      title: "Cash Drawer Report",
      metrics: [
        { label: "Total Network Cash", value: data.metrics.totalNetworkCashDisplay },
        { label: "Total Discrepancy", value: data.metrics.totalDiscrepancyDisplay },
      ],
      headers: ["ID", "Branch", "Cashier", "Opened", "Closed", "Starting", "Expected", "Actual", "Net Impact", "Difference", "Status"],
      rows,
      filename: `cash-drawer-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  const metrics = data?.metrics

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Network Cash"
          value={metrics?.totalNetworkCashDisplay ?? "₱0.00"}
          trend={`${metrics?.closedCount ?? 0} closed sessions`}
          trendType="up"
          icon={Wallet}
        />
        <KPICard
          title="Open Sessions"
          value={String(metrics?.openCount ?? 0)}
          trend={`${metrics?.openCount ?? 0} drawer(s) currently open`}
          trendType="warning"
          icon={BadgeCheck}
        />
        <KPICard
          title="Total Discrepancy"
          value={metrics?.totalDiscrepancyDisplay ?? "₱0.00"}
          trend={metrics ? (metrics.totalDiscrepancy > 0 ? "over" : metrics.totalDiscrepancy < 0 ? "short" : "balanced") : "—"}
          trendType={metrics ? (metrics.totalDiscrepancy < 0 ? "down" : "up") : "warning"}
          icon={Scale}
        />
      </div>
      <CashDrawerTable
        sessions={data?.sessions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        branches={data?.branches || []}
        branchId={branchId}
        onBranchChange={handleBranchChange}
        cashiers={data?.cashiers || []}
        cashierId={cashierId}
        onCashierChange={handleCashierChange}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={handleDateChange}
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
