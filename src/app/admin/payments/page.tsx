"use client"

import { useState, useEffect, useCallback } from "react"
import { PaymentTable, KPICard } from "@/features/admin-dashboard"
import { Wallet, Banknote, Smartphone } from "lucide-react"
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

  const metrics = data?.metrics
  const completedCount = metrics?.completedCount ?? 0
  const pendingCount = metrics?.pendingCount ?? 0
  const cashPct = metrics?.cashPercentage ?? 0
  const gcashPct = metrics?.gcashPercentage ?? 0

  const isLoading = authLoading || (token != null && !firstLoadDone)

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
        loading={isLoading}
      />
    </div>
  )
}
