"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText, FileX, Eye, Search } from "lucide-react"
import { AuditLogDetailsModal } from "./audit-log-details-modal"
import type { AuditLogRow } from "../actions/get-audit-logs"

interface AuditLogTableProps {
  logs: AuditLogRow[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  category: string
  onCategoryChange: (category: string) => void
  severity: string
  onSeverityChange: (severity: string) => void
  search: string
  onSearchChange: (search: string) => void
  dateFrom: string
  dateTo: string
  onDateChange: (dateFrom: string, dateTo: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
  loading: boolean
}

const SEVERITY_BADGE_STYLE: Record<AuditLogRow["severity"], string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

const CATEGORY_BADGE_STYLE: Record<string, string> = {
  auth: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  inventory: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cash_drawer: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  user_mgmt: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  orders: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  settings: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
}

export function AuditLogTable({
  logs,
  totalCount,
  page,
  pageSize,
  onPageChange,
  category,
  onCategoryChange,
  severity,
  onSeverityChange,
  search,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateChange,
  onExportCSV,
  onExportPDF,
  loading,
}: AuditLogTableProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const start = totalCount > 0 ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, totalCount)
  const hasFilters = category || severity || search || dateFrom || dateTo

  return (
    <>
      <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Section Header Toolbar (Matches Monitoring Page Header) */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
          <div>
            <h4 className="font-bold text-lg text-foreground">Audit Logs & Activity Trail</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time system events, user actions, and security audit records.</p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="inventory">Inventory</option>
              <option value="cash_drawer">Cash Drawer</option>
              <option value="user_mgmt">User Management</option>
              <option value="orders">Orders</option>
              <option value="settings">Settings</option>
            </select>
            <select
              value={severity}
              onChange={(e) => onSeverityChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>

            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all w-full md:w-auto justify-center"
              >
                <Download className="h-[18px] w-[18px]" />
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { onExportCSV?.(); setExportOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export as CSV (Excel)
                  </button>
                  <button
                    onClick={() => { onExportPDF?.(); setExportOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
                  >
                    <FileText className="h-4 w-4 text-red-600" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar: Search & Dates */}
        <div className="p-4 border-b border-border bg-muted/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by actor name, email, action, or details..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-xs focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => onDateChange(e.target.value, dateTo)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:ring-primary focus:border-primary outline-none"
            />
            <span className="text-muted-foreground">—</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => onDateChange(dateFrom, e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:ring-primary focus:border-primary outline-none"
            />
            {hasFilters && (
              <button
                onClick={() => { onCategoryChange(""); onSeverityChange(""); onSearchChange(""); onDateChange("", "") }}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted text-xs font-bold transition-colors ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileX className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-foreground">No audit log records found.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
                </div>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse" style={{ minWidth: 960 }}>
              <thead className="bg-muted/40 border-b border-border">
                <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                  <th className="px-6 py-4 whitespace-nowrap">User & Role</th>
                  <th className="px-6 py-4 whitespace-nowrap">Category</th>
                  <th className="px-6 py-4 whitespace-nowrap">Action</th>
                  <th className="px-6 py-4 whitespace-nowrap">Severity</th>
                  <th className="px-6 py-4 whitespace-nowrap">Details Summary</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-foreground whitespace-nowrap">
                      {log.createdAtDisplay}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">{log.userName}</span>
                        <span className="text-xs text-muted-foreground">{log.userEmail || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_BADGE_STYLE[log.category] || "bg-muted text-muted-foreground border-border"}`}>
                        {log.categoryDisplay}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-primary">
                      {log.action}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${SEVERITY_BADGE_STYLE[log.severity]}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-[240px] truncate" title={log.details || ""}>
                      {log.details || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-muted rounded-lg text-primary transition-colors inline-flex items-center justify-center"
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

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-between items-center">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Showing {start} to {end} of {totalCount} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      <AuditLogDetailsModal
        key={selectedLog?.id ?? "none"}
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </>
  )
}
