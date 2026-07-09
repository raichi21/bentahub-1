"use client"

import { useState, useEffect, useCallback } from "react"
import { PickupMetrics, PickupTable } from "@/features/admin-dashboard"
import { useAuth } from "@/hooks/useAuth"
import type { PickupApiData } from "@/types/admin"

export default function PickupsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PickupApiData | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (search) params.set("search", search)

      const res = await fetch(`/api/admin/pickups?${params}`, {
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
      <PickupMetrics metrics={data?.metrics || null} loading={isLoading} />
      <PickupTable
        pickups={data?.pickups || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        onSearch={handleSearch}
        onConfirm={handleConfirm}
        loading={isLoading}
      />
    </div>
  )
}
