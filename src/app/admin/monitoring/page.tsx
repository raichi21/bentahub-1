"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { InventoryStatusTable, KPICard } from "@/features/admin-dashboard"
import { Package, AlertTriangle, Clock, ExternalLink } from "lucide-react"
import type {
  MonitoringData,
  InventoryStatusItem,
  ExpiringItemData,
} from "@/types/admin"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"
import { cn } from "@/lib/utils"

export default function MonitoringPage() {
  // ── All hooks must be before any early return ──
  const { token, isLoading: authLoading, isAuthenticated } = useAuth()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [selectedBranch, setSelectedBranch] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)
  const [branchesFetched, setBranchesFetched] = useState(false)

  // Fetch monitoring data
  useEffect(() => {
    if (!token) return

    const params = new URLSearchParams()
    if (selectedBranch !== "all") params.set("branchId", selectedBranch)
    if (selectedDate) {
      params.set("dateFrom", selectedDate)
      params.set("dateTo", selectedDate)
    }
    const query = params.toString()

    fetch(`/api/admin/monitoring${query ? `?${query}` : ""}`, {
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
  }, [token, selectedBranch, selectedDate])

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
      [
        i.productName,
        i.category,
        i.branchName,
        i.totalQuantity,
        i.reorderLevel,
        i.earliestExpiry
          ? new Date(i.earliestExpiry).toLocaleDateString("en-PH")
          : "",
        i.status,
        i.lastUpdated,
      ].join(",")
    )
    const csv = [
      "Product,Category,Branch,Quantity,Reorder Level,Nearest Expiry,Status,Last Updated",
      ...rows,
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `monitoring-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    if (!data) return
    const tableRows = data.inventoryStatus.map((i: InventoryStatusItem) => [
      i.productName,
      i.category,
      i.branchName,
      String(i.totalQuantity),
      String(i.reorderLevel),
      i.earliestExpiry
        ? new Date(i.earliestExpiry).toLocaleDateString("en-PH")
        : "—",
      i.status,
      new Date(i.lastUpdated).toLocaleDateString(),
    ])
    exportTableAsPdf({
      title: "Inventory Monitoring Report",
      metrics: [
        {
          label: "Total Stock Value",
          value: data.metrics.totalStockValue.value,
        },
        {
          label: "Low Stock Items",
          value: String(data.metrics.lowStockItems.value),
        },
        {
          label: "Pending Reservations",
          value: String(data.metrics.pendingReservations.value),
        },
      ],
      headers: [
        "Product",
        "Category",
        "Branch",
        "Quantity",
        "Reorder Level",
        "Nearest Expiry",
        "Status",
        "Last Updated",
      ],
      rows: tableRows,
      filename: `monitoring-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  // ── Render ──
  if (!authLoading && !token) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8 text-center">
        <p className="text-sm text-red-500">
          Not authenticated. Auth state: loading={String(authLoading)},
          hasToken={String(!!token)}, isAuth={String(isAuthenticated)}
        </p>
        <p className="mt-2 text-sm text-red-500">
          Try going to{" "}
          <a href="/login" className="underline">
            /login
          </a>{" "}
          to log in again.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="h-[400px] animate-pulse rounded-xl border border-border bg-card p-6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl p-8 text-center">
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          trendType={
            data?.metrics.lowStockItems.severity === "Critical"
              ? "warning"
              : "up"
          }
          icon={AlertTriangle}
        />
      </div>

      {/* Expiring Items Section */}
      {data?.expiringItems && data.expiringItems.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/20 p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h4 className="text-lg font-bold text-foreground">
                Expiring Soon
              </h4>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold tracking-widest text-amber-700 text-muted-foreground uppercase">
                {data.expiringItems.length}{" "}
                {data.expiringItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <Link
              href="/admin/sales"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary/80"
            >
              View Details
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
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
                    <tr
                      key={`${item.productId}-${i}`}
                      className="transition-colors hover:bg-primary/5"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.branchName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {item.batchNumber || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "font-mono text-xs",
                            isUrgent
                              ? "font-bold text-red-600"
                              : "font-bold text-amber-600"
                          )}
                        >
                          {new Date(item.expiryDate).toLocaleDateString(
                            "en-PH",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                            isUrgent
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          )}
                        >
                          {isUrgent
                            ? `⚠ URGENT: ${item.daysUntilExpiry} days left`
                            : `${item.daysUntilExpiry} days left`}
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
        dateValue={selectedDate}
        onDateValueChange={setSelectedDate}
      />
    </div>
  )
}
