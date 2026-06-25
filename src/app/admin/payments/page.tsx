import { PaymentMetrics, PaymentTable } from "@/features/admin-dashboard"

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-8">
      {/* Summary Cards */}
      <PaymentMetrics />

      {/* Payment Records Table */}
      <PaymentTable />
    </div>
  )
}
