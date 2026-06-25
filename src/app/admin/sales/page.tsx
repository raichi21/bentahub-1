"use client"

import { useState, useEffect, useCallback } from "react"
import { SalesFilters, SalesMetrics, TransactionDetailsTable } from "@/features/admin-dashboard"
import type { SalesApiData } from "@/types/admin"

export default function SalesPage() {
  const [data, setData] = useState<SalesApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [branchId, setBranchId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/sales?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setLoading(false)
    }
  }, [branchId, dateFrom, dateTo, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilter = (fBranchId: string, fDateFrom: string, fDateTo: string) => {
    setBranchId(fBranchId)
    setDateFrom(fDateFrom)
    setDateTo(fDateTo)
    setPage(1)
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
        />
        <SalesMetrics overview={data?.overview || null} loading={loading} />
      </div>
      <TransactionDetailsTable
        transactions={data?.transactions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  )
}
