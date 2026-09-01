"use client"

import { useState, useEffect, useCallback } from "react"
import { AuditLogTable, KPICard } from "@/features/admin-dashboard"
import { Activity, ShieldAlert, AlertOctagon, PackageCheck } from "lucide-react"
import type { AuditLogsData, AuditLogRow } from "@/features/admin-dashboard/actions/get-audit-logs"
import { useAuth } from "@/hooks/useAuth"
import { exportTableAsPdf } from "@/lib/export-pdf"

export default function AuditLogsPage() {
  const { token, isLoading: authLoading, isAuthenticated } = useAuth()
  const [data, setData] = useState<AuditLogsData | null>(null)
  const [category, setCategory] = useState("")
  const [severity, setSeverity] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!token) return

    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (severity) params.set("severity", severity)
    if (search) params.set("search", search)
    if (dateFrom) params.set("dateFrom", dateFrom)
    if (dateTo) params.set("dateTo", dateTo)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))

    try {
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
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
        setError(json.message || "Failed to load audit logs")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFetched(true)
    }
  }, [token, category, severity, search, dateFrom, dateTo, page])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => fetchLogs(), 0)
    return () => clearTimeout(timer)
  }, [token, fetchLogs])

  const isLoading = Boolean(authLoading || (!authLoading && token && !fetched && !error))

  function handleExportCSV() {
    if (!data || data.logs.length === 0) return
    const headers = ["ID", "Timestamp", "User Name", "Email", "Role", "Category", "Action", "Severity", "Details", "IP Address"]
    const rows = data.logs.map((l: AuditLogRow) => [
      l.id,
      l.createdAtDisplay,
      `"${(l.userName || "").replace(/"/g, '""')}"`,
      `"${(l.userEmail || "").replace(/"/g, '""')}"`,
      l.userRole || "",
      l.categoryDisplay,
      l.action,
      l.severity,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ipAddress || "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportPDF() {
    if (!data || data.logs.length === 0) return
    const tableRows = data.logs.map((l: AuditLogRow) => [
      l.createdAtDisplay,
      `${l.userName} (${l.userRole})`,
      l.categoryDisplay,
      l.action,
      l.severity.toUpperCase(),
      (l.details || "—").slice(0, 40),
    ])
    exportTableAsPdf({
      title: "Audit Trail & Activity Log Report",
      metrics: [
        { label: "Total Logs", value: String(data.metrics.totalLogs) },
        { label: "Security Events", value: String(data.metrics.securityEvents) },
        { label: "Inventory Events", value: String(data.metrics.inventoryEvents) },
        { label: "Critical Events", value: String(data.metrics.criticalEvents) },
      ],
      headers: ["Timestamp", "User (Role)", "Category", "Action", "Severity", "Details"],
      rows: tableRows,
      filename: `audit-trail-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    })
  }

  if (!authLoading && !token) {
    return (
      <div className="p-8 text-center max-w-7xl mx-auto w-full">
        <p className="text-sm text-red-500">
          Not authenticated. Auth state: loading={String(authLoading)}, hasToken={String(!!token)}, isAuth={String(isAuthenticated)}
        </p>
        <p className="text-sm text-red-500 mt-2">
          Try going to <a href="/login" className="underline">/login</a> to log in again.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* KPI Cards Grid (Matches Monitoring Page Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Audit Logs"
          value={String(data?.metrics.totalLogs ?? 0)}
          trend="All recorded system events"
          trendType="up"
          icon={Activity}
        />
        <KPICard
          title="Security & User Events"
          value={String(data?.metrics.securityEvents ?? 0)}
          trend="Logins & role updates"
          trendType="up"
          icon={ShieldAlert}
        />
        <KPICard
          title="Inventory Events"
          value={String(data?.metrics.inventoryEvents ?? 0)}
          trend="Stock updates & restocks"
          trendType="up"
          icon={PackageCheck}
        />
        <KPICard
          title="Critical Events"
          value={String(data?.metrics.criticalEvents ?? 0)}
          trend={data?.metrics.criticalEvents ? "Requires review" : "Normal"}
          trendType={data?.metrics.criticalEvents ? "warning" : "up"}
          icon={AlertOctagon}
        />
      </div>

      {/* Audit Log Table (Matches Monitoring Table Layout) */}
      <AuditLogTable
        logs={data?.logs ?? []}
        totalCount={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        category={category}
        onCategoryChange={(cat) => { setCategory(cat); setPage(1); }}
        severity={severity}
        onSeverityChange={(sev) => { setSeverity(sev); setPage(1); }}
        search={search}
        onSearchChange={(s) => { setSearch(s); setPage(1); }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(df, dt) => { setDateFrom(df); setDateTo(dt); setPage(1); }}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        loading={isLoading}
      />
    </div>
  )
}
