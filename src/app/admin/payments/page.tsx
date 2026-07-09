"use client"

import { useState, useEffect, useCallback } from "react"
import { PaymentMetrics, PaymentTable } from "@/features/admin-dashboard"
import { useAuth } from "@/hooks/useAuth"
import type { PaymentApiData } from "@/types/admin"

export default function PaymentsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PaymentApiData | null>(null)
  const [page, setPage] = useState(1)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/admin/payments?page=${page}&pageSize=15`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      }
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      <PaymentMetrics metrics={data?.metrics || null} loading={isLoading} />
      <PaymentTable
        payments={data?.payments || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        loading={isLoading}
      />
    </div>
  )
}
