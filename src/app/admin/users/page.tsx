"use client"

import { useState, useEffect, useCallback } from "react"
import { UserTable, KPICard } from "@/features/admin-dashboard"
import { UserPlus, ShieldCheck, Shield } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { UsersApiData } from "@/types/admin"

export default function UsersPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<UsersApiData | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/users?${params}`, {
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
    }
  }, [token, search, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const metrics = data?.metrics
  const activeRate = metrics && metrics.total > 0 ? ((metrics.active / metrics.total) * 100).toFixed(1) : "0"
  const roleSummary = `${(metrics?.adminCount ?? 0) + (metrics?.staffCount ?? 0) + (metrics?.cashierCount ?? 0)} total, ${metrics?.customerCount ?? 0} customers`

  const isLoading = authLoading || (token != null && data == null && error == null)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="New This Week"
          value={String(metrics?.newThisWeek ?? 0)}
          trend="New users"
          trendType="up"
          icon={UserPlus}
        />
        <KPICard
          title="Active Rate"
          value={`${activeRate}%`}
          trend="Active accounts"
          trendType="up"
          icon={ShieldCheck}
        />
        <KPICard
          title="Role Breakdown"
          value={roleSummary}
          trend="Staff & customers"
          trendType="up"
          icon={Shield}
        />
      </div>
      <UserTable
        users={data?.users || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        onSearch={handleSearch}
        onRefresh={fetchData}
        loading={isLoading}
        token={token}
      />
    </div>
  )
}
