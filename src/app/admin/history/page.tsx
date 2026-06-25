import { HistoryMetrics, HistoryTable } from "@/features/admin-dashboard"

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* KPI Cards */}
      <HistoryMetrics />

      {/* All Branch Transactions Table */}
      <HistoryTable />
    </div>
  )
}
