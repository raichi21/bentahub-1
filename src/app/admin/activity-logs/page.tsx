"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ActivityLogsTable,
  type ActivityLogRowData,
  KPICard,
} from "@/features/admin-dashboard"
import { ScrollText } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { downloadCsv } from "@/lib/export-csv"
import { RoleGate } from "@/components/role-gate"

export default function ActivityLogsPage() {
  return (
    <RoleGate allow={["admin"]}>
      <ActivityLogsPageInner />
    </RoleGate>
  )
}

function ActivityLogsPageInner() {
  const { token, isLoading: authLoading } = useAuth()
  const [logs, setLogs] = useState<ActivityLogRowData[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [action, setAction] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchData = useCallback(async () => {
    if (!token) return
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
      })
      if (search) params.set("search", search)
      if (action) params.set("action", action)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const res = await fetch(`/api/admin/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`API ${res.status}: ${text.slice(0, 200)}`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        setLogs(json.data.logs)
        setTotalCount(json.data.totalCount)
        setError(null)
      } else {
        throw new Error(json.message || "API returned success=false")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setFetched(true)
    }
  }, [token, page, search, action, dateFrom, dateTo])

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  const isLoading = authLoading || (token != null && !fetched && !error)

  function exportCSV() {
    if (logs.length === 0) return
    downloadCsv(
      `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Actor", "Role", "Action", "Target", "Branch"],
      logs.map((l) => [
        new Date(l.createdAt).toISOString(),
        l.actorName || "",
        l.actorRole || "",
        l.action,
        l.entityName || l.entityId || "",
        l.branch || "",
      ])
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <KPICard
          title="Total Events"
          value={String(totalCount)}
          trend="All recorded activity"
          trendType="up"
          icon={ScrollText}
        />
      </div>
      <ActivityLogsTable
        logs={logs}
        totalCount={totalCount}
        page={page}
        pageSize={15}
        onPageChange={setPage}
        onSearch={(q) => {
          setSearch(q)
          setPage(1)
        }}
        actionValue={action}
        onActionChange={(a) => {
          setAction(a)
          setPage(1)
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(from, to) => {
          setDateFrom(from)
          setDateTo(to)
          setPage(1)
        }}
        onExportCSV={exportCSV}
        loading={isLoading}
      />
    </div>
  )
}
