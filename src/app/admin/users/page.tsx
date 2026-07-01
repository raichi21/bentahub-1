"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UserMetrics, UserTable } from "@/features/admin-dashboard"
import { useAuth } from "@/hooks/useAuth"
import type { UsersApiData } from "@/types/admin"

export default function UsersPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<UsersApiData | null>(null)
  const [fetched, setFetched] = useState(false)
  const [role, setRole] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    fetchedRef.current = false
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (role) params.set("role", role)
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      fetchedRef.current = true
      setFetched(true)
    }
  }, [token, role, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || Boolean(token && !fetched && !data) || Boolean(token && !fetchedRef.current)

  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <UserMetrics metrics={data?.metrics || null} loading={isLoading} />
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
