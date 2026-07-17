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

  function exportPDF() {
    if (!data) return
    const tableRows = data.transactions.map((t) =>
      `<tr><td>${t.dateDisplay}</td><td>${t.displayId}</td><td>${t.branchName}</td><td>${t.itemsCount}</td><td>${t.totalAmountDisplay}</td><td>${t.paymentMethodDisplay}</td><td>${t.statusDisplay}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Transaction History Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        p { color: #666; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f5f5f5; text-align: left; padding: 10px 12px; border-bottom: 2px solid #ddd; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; }
        .metrics { display: flex; gap: 24px; margin-bottom: 24px; }
        .metric { background: #f9f9f9; padding: 16px; border-radius: 8px; flex: 1; }
        .metric-label { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
        .metric-value { font-size: 20px; font-weight: bold; }
      </style></head><body>
      <h1>Transaction History Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Transactions</div><div class="metric-value">${data.metrics.totalTransactionsDisplay}</div></div>
        <div class="metric"><div class="metric-label">Total Sales (PHP)</div><div class="metric-value">${data.metrics.totalSalesDisplay}</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>ID</th><th>Branch</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
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
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
