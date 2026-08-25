"use client"

import { useState, useEffect } from "react"
import { KPICard, SalesChart, TopProductsCard, LowStockByCategoryCard, PaymentBreakdownCard } from "@/features/admin-dashboard"
import { CreditCard, Package, AlertTriangle } from "lucide-react"
import type { AdminOverviewData, TopProductData, LowStockByCategoryData, PaymentBreakdownData } from "@/types/admin"
import { useAuth } from "@/hooks/useAuth"

export default function AdminPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<AdminOverviewData | null>(null)
  const [topProducts, setTopProducts] = useState<TopProductData[]>([])
  const [lowStockByCategory, setLowStockByCategory] = useState<LowStockByCategoryData[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdownData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!token) return

    Promise.all([
      fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("/api/admin/top-products", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("/api/admin/low-stock-by-category", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([overviewJson, topProductsJson, lowStockJson]) => {

        if (overviewJson.success && overviewJson.data) {
          setData(overviewJson.data)
          setPaymentBreakdown(overviewJson.data.paymentBreakdown)
        } else {
          setError(overviewJson.message)
        }
        if (topProductsJson.success && topProductsJson.data) {
          setTopProducts(topProductsJson.data)
        }
        if (lowStockJson.success && lowStockJson.data) {
          setLowStockByCategory(lowStockJson.data)
        }
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setFetched(true))
  }, [token])

  const isLoading = authLoading || (token && !fetched && !error)

  if (isLoading) {
    return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12 bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="lg:col-span-4 bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Revenue"
          value={data?.kpis.totalRevenue.value ?? "₱0.00"}
          trend={data?.kpis.totalRevenue.trend ?? "0%"}
          trendType={data?.kpis.totalRevenue.trendType ?? "up"}
          icon={CreditCard}
          showTrendPrefix
        />
        <KPICard
          title="Total Inventory"
          value={data?.kpis.totalInventory.value ?? "0 items"}
          trend={data?.kpis.totalInventory.trend ?? "0 products"}
          trendType={data?.kpis.totalInventory.trendType ?? "up"}
          icon={Package}
        />
        <KPICard
          title="Low Stock Alerts"
          value={`${data?.kpis.lowStockAlerts.value ?? 0} items`}
          trend="Requires attention"
          trendType="warning"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <SalesChart data={data?.salesTrend} weeklyData={data?.weeklyTrend} dailyData={data?.dailyTrend} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <TopProductsCard data={topProducts} />
        </div>
        <div className="lg:col-span-4">
          <LowStockByCategoryCard data={lowStockByCategory} />
        </div>
        <div className="lg:col-span-4">
          <PaymentBreakdownCard data={paymentBreakdown} />
        </div>
      </div>

    </div>
  )
}
