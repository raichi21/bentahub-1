"use client"

import { useState, useEffect, useCallback } from "react"
import { TransactionDetailsTable, KPICard } from "@/features/admin-dashboard"
import { TrendingUp, Receipt, BarChart3 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { SalesApiData } from "@/types/admin"

export default function SalesPage() {
  const { token, isLoading: authLoading } = useAuth()
  const [data, setData] = useState<SalesApiData | null>(null)
  const [branchId, setBranchId] = useState("")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" })
      if (branchId) params.set("branchId", branchId)

      const res = await fetch(`/api/admin/sales?${params}`, {
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
    } finally {
      setFirstLoadDone(true)
    }
  }, [token, branchId, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isLoading = authLoading || (token != null && !firstLoadDone)

  const handleBranchChange = (fBranchId: string) => {
    setBranchId(fBranchId)
    setPage(1)
  }

  function exportCSV() {
    const transactions = data?.transactions || []
    if (transactions.length === 0) return
    const rows = [
      ["Transaction ID", "Branch", "Date & Time", "Total", "Payment Method", "Status"],
      ...transactions.map((t) => [
        t.id, t.branchName,
        new Date(t.createdAt).toISOString(),
        t.totalAmount, t.paymentMethod, t.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.transactions.map((t) =>
      `<tr><td>${t.id}</td><td>${t.branchName}</td><td>${new Date(t.createdAt).toLocaleString()}</td><td>${t.totalAmount}</td><td>${t.paymentMethod}</td><td>${t.status}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Sales Report</title>
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
      <h1>Sales Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Sales</div><div class="metric-value">${data.overview.totalSalesDisplay}</div></div>
        <div class="metric"><div class="metric-label">Transactions</div><div class="metric-value">${data.overview.transactionCount}</div></div>
        <div class="metric"><div class="metric-label">Avg Per Transaction</div><div class="metric-value">${data.overview.avgPerTransactionDisplay}</div></div>
      </div>
      <table><thead><tr><th>ID</th><th>Branch</th><th>Date & Time</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Sales"
          value={data?.overview.totalSalesDisplay ?? "₱0.00"}
          trend={data?.overview.trend ?? "0%"}
          trendType="up"
          icon={TrendingUp}
        />
        <KPICard
          title="Transactions"
          value={data?.overview.transactionCount?.toLocaleString() ?? "0"}
          trend="Completed"
          trendType="up"
          icon={Receipt}
        />
        <KPICard
          title="Avg Per Transaction"
          value={data?.overview.avgPerTransactionDisplay ?? "₱0.00"}
          trend="Basket average"
          trendType="up"
          icon={BarChart3}
        />
      </div>

      <TransactionDetailsTable
        transactions={data?.transactions || []}
        totalCount={data?.totalCount || 0}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        branches={data?.branches || []}
        branchId={branchId}
        onBranchChange={handleBranchChange}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
