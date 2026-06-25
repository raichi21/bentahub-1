import { PickupMetrics, PickupTable } from "@/features/admin-dashboard"

export default function PickupsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* Summary Cards */}
      <PickupMetrics />

      {/* Pending Pickups Table */}
      <PickupTable />
    </div>
  )
}
