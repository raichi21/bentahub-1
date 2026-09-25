"use client"

import { useState, useEffect, useCallback } from "react"
import { UserTable, KPICard } from "@/features/admin-dashboard"
import { ArchiveRestore, Shield } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { UsersApiData } from "@/types/admin"

export default function ArchivedUsersPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<UsersApiData | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        status: "archived",
      })
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
  const roleSummary = `${(metrics?.adminCount ?? 0) + (metrics?.staffCount ?? 0) + (metrics?.cashierCount ?? 0)} staff, ${metrics?.customerCount ?? 0} customers`

  const isLoading =
    authLoading || (token != null && data == null && error == null)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <KPICard
          title="Archived Users"
          value={String(data?.totalCount ?? 0)}
          trend="Deactivated accounts"
          trendType="up"
          icon={ArchiveRestore}
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
        mode="archived"
      />
    </div>
  )
}
