"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { TableSearchInput, TablePagination } from "@/components/data-table"
import { cn } from "@/lib/utils"
import type { PaymentItem } from "./payment-pickup-list"

const PAYMENTS_PER_PAGE = 10

interface PaymentsSectionProps {
  payments: PaymentItem[]
  onVerifyRequest: (item: PaymentItem) => void
}

export function PaymentsSection({
  payments,
  onVerifyRequest,
}: PaymentsSectionProps) {
  const [paymentSearch, setPaymentSearch] = useState("")
  const [paymentPage, setPaymentPage] = useState(1)

  const filteredPayments = payments.filter((p) => {
    const q = paymentSearch.toLowerCase()
    return (
      p.id.toLowerCase().includes(q) ||
      p.referenceNumber.toLowerCase().includes(q) ||
      (p.customerName?.toLowerCase().includes(q) ?? false)
    )
  })

  const paymentTotalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE)
  )
  const currentPaymentPage = Math.min(paymentPage, paymentTotalPages)
  const paginatedPayments = filteredPayments.slice(
    (currentPaymentPage - 1) * PAYMENTS_PER_PAGE,
    currentPaymentPage * PAYMENTS_PER_PAGE
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border bg-muted/20 p-6">
        <TableSearchInput
          placeholder="Search payments by reference or customer..."
          debounceMs={0}
          wrapperClassName="relative w-full"
          onSearch={(q) => {
            setPaymentSearch(q)
            setPaymentPage(1)
          }}
        />
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Order
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Customer
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Reference
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Method
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Amount
              </th>
              <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-bold tracking-wider uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedPayments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-xs text-muted-foreground"
                >
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p, index) => {
                const globalIndex =
                  (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + index
                return (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-muted/10"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                      ORD-{String(globalIndex + 1).padStart(3, "0")}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.customerName || "—"}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                      {p.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase",
                          p.method === "gcash"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : "border-amber-200 bg-amber-50 text-amber-600"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            p.method === "gcash"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          )}
                        />
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                      ₱{p.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold",
                          p.status === "verified"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : p.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        )}
                      >
                        {p.status === "verified" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : p.status === "pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "pending" ? (
                        <button
                          onClick={() => onVerifyRequest(p)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/95"
                        >
                          Verify
                        </button>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredPayments.length > PAYMENTS_PER_PAGE && (
        <TablePagination
          page={currentPaymentPage}
          pageSize={PAYMENTS_PER_PAGE}
          totalCount={filteredPayments.length}
          currentCount={paginatedPayments.length}
          onPageChange={setPaymentPage}
          unit="entries"
          variant="compact"
        />
      )}
    </div>
  )
}
