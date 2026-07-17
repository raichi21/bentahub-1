"use client"

import { useState, useEffect, useCallback } from "react"
import { HistoryTable, KPICard } from "@/features/admin-dashboard"
import { Receipt, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { HistoryApiData } from "@/types/admin"

export default function HistoryPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<HistoryApiData | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Total Transactions"
          value={data?.metrics?.totalTransactionsDisplay ?? "0"}
          trend={data?.metrics?.trend ?? "0%"}
          trendType="up"
          icon={Receipt}
        />
        <KPICard
          title="Total Sales (PHP)"
          value={data?.metrics?.totalSalesDisplay ?? "₱0.00"}
          trend="Completed"
          trendType="up"
          icon={TrendingUp}
        />
      </div>
      <HistoryTable
        transactions={data?.transactions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        onSearch={handleSearch}
        loading={isLoading}
      />
    </div>
  )
}
