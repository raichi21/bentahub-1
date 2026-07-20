import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  trend: string
  trendType: "up" | "down" | "warning"
  icon: LucideIcon
  showTrendPrefix?: boolean
}

export function KPICard({ title, value, trend, trendType, icon: Icon, showTrendPrefix = false }: KPICardProps) {
  const trendColor = {
    up: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
    down: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
  }[trendType]

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <div className="flex items-center gap-1 text-xs">
          <span className={cn("px-1.5 py-0.5 rounded-full font-medium", trendColor)}>
            {trend}
          </span>
          {showTrendPrefix && (
            <span className="text-muted-foreground">from last month</span>
          )}
        </div>
      </div>
    </div>
  )
}
