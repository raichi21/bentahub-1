"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { InventoryStatusTable, KPICard } from "@/features/admin-dashboard"
import { Package, AlertTriangle, Clock, ExternalLink } from "lucide-react"
import type { MonitoringData, InventoryStatusItem, ExpiringItemData } from "@/types/admin"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
import { cn } from "@/lib/utils"

export default function MonitoringPage() {
  // ── All hooks must be before any early return ──
  const { token, isLoading: authLoading, isAuthenticated } = useAuth()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [branchesFetched, setBranchesFetched] = useState(false)

  // Fetch monitoring data
  useEffect(() => {
    if (!token) return

    const params = selectedBranch !== "all" ? `?branchId=${selectedBranch}` : ""

    fetch(`/api/admin/monitoring${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
        }
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data)
          setError(null)
        } else {
          setError(json.message || "API returned success=false")
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        setFetched(true)
      })
  }, [token, selectedBranch])

  // Fetch branches for filter dropdown (public endpoint — no auth needed)
  useEffect(() => {
    if (branchesFetched) return
    fetch("/api/branches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setBranches(json.data)
        }
      })
      .catch(() => {})
      .finally(() => setBranchesFetched(true))
  }, [branchesFetched])

  // ── Derived state ──
  const isLoading = authLoading || (!authLoading && token && !fetched && !error)

  // ── Helper functions ──
  function exportCSV() {
    if (!data) return
    const rows = data.inventoryStatus.map((i: InventoryStatusItem) =>
      [i.productName, i.category, i.branchName, i.totalQuantity, i.reorderLevel, i.earliestExpiry ? new Date(i.earliestExpiry).toLocaleDateString("en-PH") : "", i.status, i.lastUpdated].join(",")
    )
    const csv = ["Product,Category,Branch,Quantity,Reorder Level,Nearest Expiry,Status,Last Updated", ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `monitoring-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.inventoryStatus.map((i: InventoryStatusItem) => [
      i.productName, i.category, i.branchName, String(i.totalQuantity),
      String(i.reorderLevel), i.earliestExpiry ? new Date(i.earliestExpiry).toLocaleDateString("en-PH") : "—", i.status, new Date(i.lastUpdated).toLocaleDateString(),
    ])
    exportTableAsPdf({
      title: "Inventory Monitoring Report",
      metrics: [
        { label: "Total Stock Value", value: data.metrics.totalStockValue.value },
        { label: "Low Stock Items", value: String(data.metrics.lowStockItems.value) },
        { label: "Pending Reservations", value: String(data.metrics.pendingReservations.value) },
      ],
      headers: ["Product", "Category", "Branch", "Quantity", "Reorder Level", "Nearest Expiry", "Status", "Last Updated"],
      rows: tableRows,
      filename: `monitoring-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  // ── Render ──
  if (!authLoading && !token) {
    return (
      <div className="p-8 text-center max-w-7xl mx-auto w-full">
        <p className="text-sm text-red-500">Not authenticated. Auth state: loading={String(authLoading)}, hasToken={String(!!token)}, isAuth={String(isAuthenticated)}</p>
        <p className="text-sm text-red-500 mt-2">Try going to <a href="/login" className="underline">/login</a> to log in again.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-4" />
              <div className="h-8 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center max-w-7xl mx-auto w-full">
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Total Stock Value"
          value={data?.metrics.totalStockValue.value ?? "₱0"}
          trend={data?.metrics.totalStockValue.trend ?? "0%"}
          trendType="up"
          icon={Package}
        />
        <KPICard
          title="Low Stock Items"
          value={`${data?.metrics.lowStockItems.value ?? 0} items`}
          trend={data?.metrics.lowStockItems.severity ?? "Normal"}
          trendType={data?.metrics.lowStockItems.severity === "Critical" ? "warning" : "up"}
          icon={AlertTriangle}
        />
      </div>

      {/* Expiring Items Section */}
      {data?.expiringItems && data.expiringItems.length > 0 && (
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-lg text-foreground">Expiring Soon</h4>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {data.expiringItems.length} {data.expiringItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <Link
              href="/admin/sales"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              View Details
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.expiringItems.map((item: ExpiringItemData, i: number) => {
                  const isUrgent = item.daysUntilExpiry <= 7
                  return (
                    <tr key={`${item.productId}-${i}`} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm text-foreground">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.category}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.branchName}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{item.batchNumber || "—"}</td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-xs font-mono",
                          isUrgent ? "text-red-600 font-bold" : "text-amber-600 font-bold"
                        )}>
                          {new Date(item.expiryDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          isUrgent
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {isUrgent ? `⚠ URGENT: ${item.daysUntilExpiry} days left` : `${item.daysUntilExpiry} days left`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <InventoryStatusTable
        data={data?.inventoryStatus ?? []}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        onExportCSV={exportCSV}
        onExportPDF={exportPDF}
      />
    </div>
  )
}
