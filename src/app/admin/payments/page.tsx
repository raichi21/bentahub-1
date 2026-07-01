"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PaymentMetrics, PaymentTable } from "@/features/admin-dashboard"
import { useAuth } from "@/hooks/useAuth"
import type { PaymentApiData } from "@/types/admin"

export default function PaymentsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<PaymentApiData | null>(null)
  const [fetched, setFetched] = useState(false)
  const [page, setPage] = useState(1)
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    fetchedRef.current = false
    try {
      const res = await fetch(`/api/admin/payments?page=${page}&pageSize=15`, {
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
  }, [token, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || Boolean(token && !fetched && !data) || Boolean(token && !fetchedRef.current)

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
