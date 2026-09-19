import { AlertTriangle, Info, CheckCircle } from "lucide-react"
import type { SystemAlertItem } from "@/types/admin"

interface SystemAlertsProps {
  data: SystemAlertItem[]
}

export function SystemAlerts({ data }: SystemAlertsProps) {
  return (
    <div className="flex h-[380px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 p-6">
        <h4 className="text-lg font-bold text-foreground">System Alerts</h4>
      </div>
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
        {data.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No alerts
          </p>
        )}
        {data.map((alert, i) => {
          const iconMap = {
            critical: AlertTriangle,
            warning: Info,
            success: CheckCircle,
          } as const
          const Icon = iconMap[alert.type]
          const borderMap = {
            critical: "border-l-destructive",
            warning: "border-l-amber-500",
            success: "border-l-green-500",
          }
          const bgMap = {
            critical: "bg-destructive/5 dark:bg-destructive/10",
            warning: "bg-amber-500/5 dark:bg-amber-500/10",
            success: "bg-green-500/5 dark:bg-green-500/10",
          }
          const iconMapColors = {
            critical: "text-destructive",
            warning: "text-amber-500",
            success: "text-green-500",
          }

          return (
            <div
              key={i}
              className={`flex gap-4 rounded p-4 ${bgMap[alert.type]} border-l-4 ${borderMap[alert.type]}`}
            >
              <Icon
                className={`h-5 w-5 ${iconMapColors[alert.type]} shrink-0`}
              />
              <div>
                <p className="text-xs font-bold text-foreground">
                  {alert.title}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {alert.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
