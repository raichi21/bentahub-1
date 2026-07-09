"use client"

import { useState, useEffect, useCallback } from "react"
import { SalesFilters, SalesMetrics, TransactionDetailsTable } from "@/features/admin-dashboard"
import { useAuth } from "@/hooks/useAuth"
import type { SalesApiData } from "@/types/admin"

export default function SalesPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<SalesApiData | null>(null)
  const [branchId, setBranchId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/sales?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, branchId, dateFrom, dateTo, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleFilter = (fBranchId: string, fDateFrom: string, fDateTo: string) => {
    setBranchId(fBranchId)
    setDateFrom(fDateFrom)
    setDateTo(fDateTo)
    setPage(1)
  }

  const handleExport = () => {
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <SalesFilters
          branches={data?.branches || []}
          onFilter={handleFilter}
          branchId={branchId}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onExport={handleExport}
        />
        <SalesMetrics overview={data?.overview || null} loading={isLoading} />
      </div>
      <TransactionDetailsTable
        transactions={data?.transactions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        loading={isLoading}
      />
    </div>
  )
}
