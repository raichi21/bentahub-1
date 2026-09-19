import { AlertTriangle, CheckCircle, Flame, Package } from "lucide-react"

interface BranchStockItem {
  name: string
  totalItems: number
  capacity: number
  percentage: number
  status: "Healthy" | "Warning" | "Critical"
}

interface BranchStockOverviewProps {
  data?: BranchStockItem[]
}

const STATUS_COLORS: Record<string, string> = {
  Healthy: "bg-emerald-500",
  Warning: "bg-amber-500",
  Critical: "bg-rose-500",
}

export function BranchStockOverview({ data }: BranchStockOverviewProps) {
  const branches = data

  return (
    <div className="flex h-[400px] flex-col justify-between rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-foreground">
          Branch Stock Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Inventory stocks per branch
        </p>
      </div>

      {!branches || branches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-xs">No branch stock data available</p>
        </div>
      ) : (
        <div className="my-auto flex flex-col gap-6 pt-4">
          {branches.map((branch) => {
            const StatusIcon = (() => {
              switch (branch.status) {
                case "Warning":
                  return AlertTriangle
                case "Critical":
                  return Flame
                default:
                  return CheckCircle
              }
            })()

            return (
              <div
                key={branch.name}
                className="group flex cursor-pointer flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${STATUS_COLORS[branch.status]}`}
                    />
                    <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {branch.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-muted-foreground">
                      {branch.totalItems} / {branch.capacity} products
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${
                        branch.status === "Healthy"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : branch.status === "Warning"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${STATUS_COLORS[branch.status]} rounded-full transition-all duration-500 group-hover:opacity-90`}
                    style={{ width: `${branch.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs font-medium text-muted-foreground">
          Branch Status
        </span>
      </div>
    </div>
  )
}
