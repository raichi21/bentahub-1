"use client"

import { useState, useEffect, useCallback } from "react"
import { PaymentTable, KPICard } from "@/features/admin-dashboard"
import { Wallet, Banknote, Smartphone } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
import type { PaymentApiData } from "@/types/admin"

export default function PaymentsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PaymentApiData | null>(null)
  const [branchId, setBranchId] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)
      if (search) params.set("search", search)
      const res = await fetch(`/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, branchId, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const metrics = data?.metrics
  const completedCount = metrics?.completedCount ?? 0
  const pendingCount = metrics?.pendingCount ?? 0
  const cashPct = metrics?.cashPercentage ?? 0
  const gcashPct = metrics?.gcashPercentage ?? 0

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleBranchChange = (fBranchId: string) => {
    setBranchId(fBranchId)
    setPage(1)
  }

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.payments.map((p) => [
      p.displayId, p.transactionDisplayId, p.amountDisplay, p.methodDisplay,
      p.dateTimeDisplay, p.branchName, p.statusDisplay,
    ])
    exportTableAsPdf({
      title: "Payment Report",
      metrics: [
        { label: "Total Payments", value: data.metrics.totalAmountDisplay },
        { label: "Cash", value: data.metrics.cashTotalDisplay },
        { label: "GCash", value: data.metrics.gcashTotalDisplay },
      ],
      headers: ["Payment ID", "Transaction", "Amount", "Method", "Date & Time", "Branch", "Status"],
      rows: tableRows,
      filename: `payments-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Payments"
          value={metrics?.totalAmountDisplay ?? "₱0.00"}
          trend={`${completedCount} verified, ${pendingCount} pending`}
          trendType="up"
          icon={Wallet}
        />
        <KPICard
          title="Cash"
          value={metrics?.cashTotalDisplay ?? "₱0.00"}
          trend={`${cashPct}% of total`}
          trendType="up"
          icon={Banknote}
        />
        <KPICard
          title="GCash"
          value={metrics?.gcashTotalDisplay ?? "₱0.00"}
          trend={`${gcashPct}% of total`}
          trendType="up"
          icon={Smartphone}
        />
      </div>
      <PaymentTable
        payments={data?.payments || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        branches={data?.branches || []}
        branchId={branchId}
        onBranchChange={handleBranchChange}
        onSearch={handleSearch}
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
