interface BranchStockRow {
  name: string
  totalItems: number
  lowStockItems: number
  status: "Healthy" | "Warning" | "Critical"
}

interface StockTableProps {
  data?: BranchStockRow[]
}

export function StockTable({ data }: StockTableProps) {
  const branches = data

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Branch Stock Distribution</h2>
          <p className="text-sm text-muted-foreground">Inventory stocks per branch</p>
        </div>
      </div>

      {!branches || branches.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No branch stock data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left pb-3 font-medium">Branch Name</th>
                <th className="text-left pb-3 font-medium">Total Items</th>
                <th className="text-left pb-3 font-medium">Low Stock</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-right pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => {
                const statusColor = {
                  Healthy: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400",
                  Warning: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
                  Critical: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
                }[branch.status]

                return (
                  <tr key={branch.name} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="py-4 font-medium text-foreground">{branch.name}</td>
                    <td className="py-4 text-muted-foreground">{branch.totalItems}</td>
                    <td className="py-4 text-muted-foreground">{branch.lowStockItems}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-primary hover:underline text-xs font-medium">Manage</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
