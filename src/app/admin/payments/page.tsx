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

  function exportPDF() {
    if (!data) return
    const tableRows = data.payments.map((p) =>
      `<tr><td>${p.displayId}</td><td>${p.transactionDisplayId}</td><td>${p.amountDisplay}</td><td>${p.methodDisplay}</td><td>${p.dateTimeDisplay}</td><td>${p.branchName}</td><td>${p.statusDisplay}</td></tr>`
    ).join("")
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html><head><title>Payment Report</title>
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
      <h1>Payment Report</h1>
      <p>Generated on ${new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Total Payments</div><div class="metric-value">${data.metrics.totalAmountDisplay}</div></div>
        <div class="metric"><div class="metric-label">Cash</div><div class="metric-value">${data.metrics.cashTotalDisplay}</div></div>
        <div class="metric"><div class="metric-label">GCash</div><div class="metric-value">${data.metrics.gcashTotalDisplay}</div></div>
      </div>
      <table><thead><tr><th>Payment ID</th><th>Transaction</th><th>Amount</th><th>Method</th><th>Date & Time</th><th>Branch</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

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
        onExportPDF={exportPDF}
        loading={isLoading}
      />
    </div>
  )
}
