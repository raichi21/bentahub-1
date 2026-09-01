"use client"

import { X, Shield, Activity, User, Calendar, MapPin, AlertTriangle } from "lucide-react"
import type { AuditLogRow } from "../actions/get-audit-logs"

interface AuditLogDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  log: AuditLogRow | null
}

const SEVERITY_BADGE_STYLE: Record<AuditLogRow["severity"], string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

export function AuditLogDetailsModal({ isOpen, onClose, log }: AuditLogDetailsModalProps) {
  if (!isOpen || !log) return null

  const isObjectDetails = typeof log.formattedDetails === "object" && log.formattedDetails !== null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Audit Log Event Details</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${SEVERITY_BADGE_STYLE[log.severity]}`}>
              {log.severity}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-sm">
          {/* Actor & Event Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Actor Summary
              </h4>
              <p className="text-muted-foreground">User Name: <span className="font-semibold text-foreground">{log.userName}</span></p>
              <p className="text-muted-foreground">Email: <span className="font-semibold text-foreground font-mono text-xs">{log.userEmail || "—"}</span></p>
              <p className="text-muted-foreground">Role: <span className="font-semibold text-foreground uppercase text-xs">{log.userRole}</span></p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Event Metadata
              </h4>
              <p className="text-muted-foreground">Action: <span className="font-mono font-bold text-primary text-xs">{log.action}</span></p>
              <p className="text-muted-foreground">Category: <span className="font-semibold text-foreground">{log.categoryDisplay}</span></p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground inline" />
                <span>Timestamp: <span className="font-mono font-semibold text-foreground text-xs">{log.createdAtDisplay}</span></span>
              </p>
              {log.ipAddress && (
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground inline" />
                  <span>IP Address: <span className="font-mono text-xs text-foreground">{log.ipAddress}</span></span>
                </p>
              )}
            </div>
          </div>

          {/* Detailed Data Viewer */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Event Details & Payload</h4>
            {isObjectDetails ? (
              <div className="p-4 bg-muted/40 rounded-lg border border-border font-mono text-xs overflow-x-auto space-y-1.5">
                {Object.entries(log.formattedDetails as Record<string, unknown>).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground font-semibold">{key}:</span>
                    <span className="text-foreground font-medium text-right max-w-[320px] truncate" title={String(val)}>
                      {typeof val === "object" ? JSON.stringify(val) : String(val ?? "null")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-sm text-foreground whitespace-pre-wrap">
                {log.details || "No additional details recorded."}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg hover:bg-primary/95 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
