"use client"

import { useState, useEffect, useCallback } from "react"
import { TransactionDetailsTable, KPICard, DateRangeFilter } from "@/features/admin-dashboard"
import { TrendingUp, Receipt, BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
import type { SalesApiData } from "@/types/admin"

export default function SalesPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<SalesApiData | null>(null)
  const [branchId, setBranchId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [page, setPage] = useState(1)
  const [, setError] = useState<string | null>(null)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)
      if (selectedDate) {
        params.set("dateFrom", selectedDate)
        params.set("dateTo", selectedDate)
      }

      const res = await fetch(`/api/admin/sales?${params}`, {
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
  }, [token, branchId, page, selectedDate])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleBranchChange = (fBranchId: string) => {
    setBranchId(fBranchId)
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setSelectedDate(value)
    setPage(1)
  }

  function exportCSV() {
    const transactions = data?.transactions || []
    if (transactions.length === 0) return
    const rows = [
      ["Transaction ID", "Branch", "Date & Time", "Total", "Payment Method", "Status"],
      ...transactions.map((t) => [
        t.id, t.branchName,
        new Date(t.createdAt).toISOString(),
        t.totalAmount, t.paymentMethod, t.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.transactions.map((t) => [
      t.id, t.branchName,
      new Date(t.createdAt).toLocaleString(),
      t.totalAmount, t.paymentMethod, t.status,
    ])
    exportTableAsPdf({
      title: "Sales Report",
      metrics: [
        { label: "Total Sales", value: data.overview.totalSalesDisplay },
        { label: "Transactions", value: String(data.overview.transactionCount) },
        { label: "Avg Per Transaction", value: data.overview.avgPerTransactionDisplay },
      ],
      headers: ["ID", "Branch", "Date & Time", "Total", "Payment", "Status"],
      rows: tableRows,
      filename: `sales-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Sales"
          value={data?.overview.totalSalesDisplay ?? "₱0.00"}
          trend={data?.overview.trend ?? "0%"}
          trendType="up"
          icon={TrendingUp}
        />
        <KPICard
          title="Transactions"
          value={data?.overview.transactionCount?.toLocaleString() ?? "0"}
          trend="Completed"
          trendType="up"
          icon={Receipt}
        />
        <KPICard
          title="Avg Per Transaction"
          value={data?.overview.avgPerTransactionDisplay ?? "₱0.00"}
          trend="Basket average"
          trendType="up"
          icon={BarChart3}
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <DateRangeFilter
          value={selectedDate}
          onChange={handleDateChange}
        />
        <div className="text-xs text-muted-foreground ml-auto">
          {data ? `${data.overview.transactionCount.toLocaleString()} transactions` : "Loading..."}
        </div>
      </div>

      <TransactionDetailsTable
        transactions={data?.transactions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        branches={data?.branches || []}
        branchId={branchId}
        onBranchChange={handleBranchChange}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
