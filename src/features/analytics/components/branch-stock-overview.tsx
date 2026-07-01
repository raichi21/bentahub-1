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
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between h-[400px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-foreground">Branch Stock Overview</h2>
        <p className="text-sm text-muted-foreground">Inventory stocks per branch</p>
      </div>

      {!branches || branches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-xs">No branch stock data available</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 my-auto pt-4">
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
              <div key={branch.name} className="flex flex-col gap-2 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[branch.status]}`} />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {branch.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground font-medium">
                      {branch.totalItems} / {branch.capacity} products
                    </span>
                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${branch.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      branch.status === 'Warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
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

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Branch Status</span>
      </div>
    </div>
  )
}
