"use client"

import { Eye, X } from "lucide-react"
import { useState } from "react"
import {
  ExportMenu,
  TablePagination,
  TableSearchInput,
} from "@/components/data-table"
import { DateRangeFilter } from "./date-range-filter"

export interface ActivityLogRowData {
  id: string
  actorName: string | null
  actorRole: string | null
  action: string
  entity: string
  entityId: string | null
  entityName: string | null
  details: Record<string, unknown> | null
  branch: string | null
  createdAt: string | Date
}

export const ACTIVITY_LOG_ACTIONS = [
  "product.create",
  "product.update",
  "stock.update",
  "category.create",
  "category.update",
  "category.delete",
  "unit.create",
  "unit.update",
  "unit.delete",
  "user.create",
  "user.reactivate",
  "user.update",
  "user.restore",
  "user.deactivate",
  "user.permanent-delete",
]

interface ActivityLogsTableProps {
  logs: ActivityLogRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSearch: (q: string) => void
  actionValue: string
  onActionChange: (action: string) => void
  dateFrom: string
  dateTo: string
  onDateChange: (from: string, to: string) => void
  onExportCSV: () => void
  onExportPDF?: () => void
  loading: boolean
}

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function summarizeDetails(details: Record<string, unknown> | null): string {
  if (!details || typeof details !== "object") return "—"
  const parts = Object.entries(details)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
  return parts.length > 0 ? parts.join(" · ") : "—"
}

export function actionLabel(action: string): string {
  return action.replace(".", ": ").replace(/-/g, " ")
}

export function ActivityLogsTable({
  logs,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSearch,
  actionValue,
  onActionChange,
  dateFrom,
  dateTo,
  onDateChange,
  onExportCSV,
  onExportPDF,
  loading,
}: ActivityLogsTableProps) {
  const [viewingLog, setViewingLog] = useState<ActivityLogRowData | null>(null)

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 p-6 sm:flex-row sm:items-center">
          <h4 className="text-lg font-bold text-foreground">Activity Logs</h4>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <TableSearchInput
              placeholder="Search actor, action, target..."
              onSearch={onSearch}
            />
            <select
              value={actionValue}
              onChange={(e) => onActionChange(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
            >
              <option value="">All Actions</option>
              {ACTIVITY_LOG_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <DateRangeFilter
              value={dateFrom}
              label="From"
              max={dateTo || undefined}
              onChange={(v) => onDateChange(v, dateTo)}
            />
            <DateRangeFilter
              value={dateTo}
              label="To"
              min={dateFrom || undefined}
              onChange={(v) => onDateChange(dateFrom, v)}
            />
            <ExportMenu onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && logs.length === 0 ? (
            <div className="animate-pulse p-12 text-center text-sm text-muted-foreground">
              Loading activity logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-bold text-foreground">
                No activity logs found.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters.
              </p>
            </div>
          ) : (
            <table
              className="w-full border-collapse text-left"
              style={{ minWidth: 900 }}
            >
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-[11px] font-bold tracking-widest uppercase">
                  <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                  <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                  <th className="px-6 py-4 whitespace-nowrap">Action</th>
                  <th className="px-6 py-4 whitespace-nowrap">Target</th>
                  <th className="px-6 py-4 whitespace-nowrap">Branch</th>
                  <th className="px-6 py-4 whitespace-nowrap">Details</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-primary/5"
                  >
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-sm font-medium text-foreground">
                        {log.actorName || "Unknown"}
                      </span>
                      {log.actorRole && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {log.actorRole}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-primary uppercase">
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <span className="block font-medium">
                        {log.entityName || "—"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {log.branch || "—"}
                    </td>
                    <td className="max-w-[240px] truncate px-6 py-4 text-xs text-muted-foreground">
                      {summarizeDetails(log.details)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingLog(log)}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-primary transition-colors hover:bg-muted"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalCount > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            currentCount={logs.length}
            onPageChange={onPageChange}
          />
        )}
      </section>

      {viewingLog && (
        <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in">
          <div className="my-auto w-full max-w-lg animate-in overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Log Details</h2>
              <button
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setViewingLog(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <p className="text-muted-foreground">
                Actor:{" "}
                <span className="font-semibold text-foreground">
                  {viewingLog.actorName || "Unknown"}
                  {viewingLog.actorRole ? ` (${viewingLog.actorRole})` : ""}
                </span>
              </p>
              <p className="text-muted-foreground">
                Action:{" "}
                <span className="font-semibold text-foreground">
                  {actionLabel(viewingLog.action)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Target:{" "}
                <span className="font-semibold text-foreground">
                  {viewingLog.entityName || viewingLog.entityId || "—"}
                </span>
              </p>
              <p className="text-muted-foreground">
                Date:{" "}
                <span className="font-semibold text-foreground">
                  {formatDateTime(viewingLog.createdAt)}
                </span>
              </p>
              <div>
                <p className="mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Full details
                </p>
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap text-foreground">
                  {JSON.stringify(viewingLog.details ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
