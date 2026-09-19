"use client"

import { useState } from "react"
import {
  Search,
  CreditCard,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react"
import { VerifyPickupModal } from "./verify-pickup-modal"
import { CancelReservationModal } from "./cancel-reservation-modal"
import { cn } from "@/lib/utils"

type Tab = "payments" | "pickups"

const PAYMENTS_PER_PAGE = 10
const PICKUPS_PER_PAGE = 10

export interface PaymentItem {
  id: string
  transactionId: string
  referenceNumber: string
  method: "cash" | "gcash"
  amount: number
  status: "pending" | "verified" | "failed"
  date: string
  customerName?: string
}

export interface PickupItem {
  id: string
  transactionId: string
  customerName: string
  code: string
  date: string
  status: "ready" | "completed"
  pickupDeadline: string | null
}

interface PaymentPickupListProps {
  payments: PaymentItem[]
  pickups: PickupItem[]
  onVerifyPayment: (paymentId: string) => void
  onCompletePickup: (pickupId: string) => void
  onCancelPickup?: (pickupId: string) => void
}

export function PaymentPickupList({
  payments,
  pickups,
  onVerifyPayment,
  onCompletePickup,
  onCancelPickup,
}: PaymentPickupListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("payments")
  const [paymentSearch, setPaymentSearch] = useState("")
  const [pickupSearch, setPickupSearch] = useState("")
  const [paymentPage, setPaymentPage] = useState(1)
  const [pickupPage, setPickupPage] = useState(1)
  const [verifyModal, setVerifyModal] = useState<{
    type: "payment" | "pickup"
    item: PaymentItem | PickupItem
  } | null>(null)
  const [cancelPickupModal, setCancelPickupModal] = useState<PickupItem | null>(
    null
  )

  const filteredPayments = payments.filter((p) => {
    const q = paymentSearch.toLowerCase()
    return (
      p.id.toLowerCase().includes(q) ||
      p.referenceNumber.toLowerCase().includes(q) ||
      (p.customerName?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredPickups = pickups.filter((p) => {
    const q = pickupSearch.toLowerCase()
    return (
      p.id.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    )
  })

  const paymentTotalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE)
  )
  const currentPaymentPage = Math.min(paymentPage, paymentTotalPages)
  const paymentStart = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + 1
  const paymentEnd = Math.min(
    currentPaymentPage * PAYMENTS_PER_PAGE,
    filteredPayments.length
  )
  const paginatedPayments = filteredPayments.slice(
    (currentPaymentPage - 1) * PAYMENTS_PER_PAGE,
    currentPaymentPage * PAYMENTS_PER_PAGE
  )

  const pickupTotalPages = Math.max(
    1,
    Math.ceil(filteredPickups.length / PICKUPS_PER_PAGE)
  )
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const pickupStart = (currentPickupPage - 1) * PICKUPS_PER_PAGE + 1
  const pickupEnd = Math.min(
    currentPickupPage * PICKUPS_PER_PAGE,
    filteredPickups.length
  )
  const paginatedPickups = filteredPickups.slice(
    (currentPickupPage - 1) * PICKUPS_PER_PAGE,
    currentPickupPage * PICKUPS_PER_PAGE
  )

  const handleConfirm = (id: string) => {
    if (verifyModal?.type === "payment") onVerifyPayment(id)
    else onCompletePickup(id)
    setVerifyModal(null)
  }

  function isOverdue(deadline: string | null): boolean {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <VerifyPickupModal
        isOpen={!!verifyModal}
        onClose={() => setVerifyModal(null)}
        type={verifyModal?.type ?? null}
        item={
          verifyModal?.item
            ? {
                id: verifyModal.item.id,
                customerName: String(
                  "customerName" in verifyModal.item
                    ? (verifyModal.item.customerName ?? "Unknown")
                    : "Unknown"
                ),
                referenceNumber:
                  "referenceNumber" in verifyModal.item
                    ? verifyModal.item.referenceNumber
                    : undefined,
                amount:
                  "amount" in verifyModal.item
                    ? verifyModal.item.amount
                    : undefined,
                code:
                  "code" in verifyModal.item
                    ? verifyModal.item.code
                    : undefined,
                date: verifyModal.item.date,
              }
            : null
        }
        onConfirm={handleConfirm}
      />

      <CancelReservationModal
        isOpen={!!cancelPickupModal}
        onClose={() => setCancelPickupModal(null)}
        onCancel={() => {
          if (cancelPickupModal && onCancelPickup) {
            onCancelPickup(cancelPickupModal.id)
          }
          setCancelPickupModal(null)
        }}
        reservation={
          cancelPickupModal
            ? { customerName: cancelPickupModal.customerName, totalAmount: 0 }
            : null
        }
        loading={false}
      />

      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("payments")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border-b-2 px-6 py-4 text-sm font-bold transition-colors",
              activeTab === "payments"
                ? "border-primary bg-primary/5 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Payments to Verify
            <span className="ml-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              {payments.filter((p) => p.status === "pending").length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("pickups")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border-b-2 px-6 py-4 text-sm font-bold transition-colors",
              activeTab === "pickups"
                ? "border-primary bg-primary/5 text-primary"
                : "border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
            )}
          >
            <Package className="h-4 w-4" />
            Orders for Pickup
            <span className="ml-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              {pickups.filter((p) => p.status === "ready").length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "payments" && (
        <div className="flex flex-1 flex-col">
          <div className="border-b border-border bg-muted/20 p-6">
            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search payments by reference or customer..."
                value={paymentSearch}
                onChange={(e) => {
                  setPaymentSearch(e.target.value)
                  setPaymentPage(1)
                }}
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
              />
            </div>
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
                              onClick={() =>
                                setVerifyModal({ type: "payment", item: p })
                              }
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
            <div className="flex items-center justify-between border-t border-border bg-muted/5 px-6 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                Showing {paymentStart} to {paymentEnd} of{" "}
                {filteredPayments.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaymentPage(currentPaymentPage - 1)}
                  disabled={currentPaymentPage <= 1}
                  className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
                  Page {currentPaymentPage} of {paymentTotalPages}
                </span>
                <button
                  onClick={() => setPaymentPage(currentPaymentPage + 1)}
                  disabled={currentPaymentPage >= paymentTotalPages}
                  className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "pickups" && (
        <div className="flex flex-1 flex-col">
          <div className="border-b border-border bg-muted/20 p-6">
            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pickups by customer or code..."
                value={pickupSearch}
                onChange={(e) => {
                  setPickupSearch(e.target.value)
                  setPickupPage(1)
                }}
                className="w-full rounded-lg border border-border bg-background py-2 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-primary"
              />
            </div>
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
                    Code
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold tracking-wider uppercase">
                    Date
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
                {paginatedPickups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-xs text-muted-foreground"
                    >
                      No pickups found
                    </td>
                  </tr>
                ) : (
                  paginatedPickups.map((p, index) => {
                    const globalIndex =
                      (currentPickupPage - 1) * PICKUPS_PER_PAGE + index
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-muted/10"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-medium text-foreground">
                          ORD-{String(globalIndex + 1).padStart(3, "0")}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {p.customerName}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                          {p.code}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                          {new Date(p.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold",
                              p.status === "completed"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                            )}
                          >
                            {p.status === "completed" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {p.status === "completed" ? "Completed" : "Ready"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "ready" ? (
                              <button
                                onClick={() =>
                                  setVerifyModal({ type: "pickup", item: p })
                                }
                                className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/95"
                              >
                                Complete Pickup
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-muted-foreground">
                                Done
                              </span>
                            )}
                            {p.status === "ready" &&
                              isOverdue(p.pickupDeadline) &&
                              onCancelPickup && (
                                <button
                                  onClick={() => setCancelPickupModal(p)}
                                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                  title="Cancel overdue pickup"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredPickups.length > PICKUPS_PER_PAGE && (
            <div className="flex items-center justify-between border-t border-border bg-muted/5 px-6 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                Showing {pickupStart} to {pickupEnd} of {filteredPickups.length}{" "}
                entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPickupPage(currentPickupPage - 1)}
                  disabled={currentPickupPage <= 1}
                  className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
                  Page {currentPickupPage} of {pickupTotalPages}
                </span>
                <button
                  onClick={() => setPickupPage(currentPickupPage + 1)}
                  disabled={currentPickupPage >= pickupTotalPages}
                  className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
