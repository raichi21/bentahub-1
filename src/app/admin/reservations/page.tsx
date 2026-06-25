import {
  ReservationMetrics,
  ReservationFilters,
  ReservationTable,
} from "@/features/admin-dashboard"

export default function ReservationsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* KPI Cards */}
      <ReservationMetrics />

      {/* Filter Section */}
      <ReservationFilters />

      {/* Data Table */}
      <ReservationTable />
    </div>
  )
}
