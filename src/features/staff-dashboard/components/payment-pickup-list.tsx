"use client"

import { useState } from "react"
import { Search, CreditCard, Package, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react"
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

export function PaymentPickupList({ payments, pickups, onVerifyPayment, onCompletePickup, onCancelPickup }: PaymentPickupListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("payments")
  const [paymentSearch, setPaymentSearch] = useState("")
  const [pickupSearch, setPickupSearch] = useState("")
  const [paymentPage, setPaymentPage] = useState(1)
  const [pickupPage, setPickupPage] = useState(1)
  const [verifyModal, setVerifyModal] = useState<{ type: "payment" | "pickup"; item: PaymentItem | PickupItem } | null>(null)
  const [cancelPickupModal, setCancelPickupModal] = useState<PickupItem | null>(null)

  const filteredPayments = payments.filter((p) => {
    const q = paymentSearch.toLowerCase()
    return p.id.toLowerCase().includes(q) || p.referenceNumber.toLowerCase().includes(q) || (p.customerName?.toLowerCase().includes(q) ?? false)
  })

  const filteredPickups = pickups.filter((p) => {
    const q = pickupSearch.toLowerCase()
    return p.id.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
  })

  const paymentTotalPages = Math.max(1, Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE))
  const currentPaymentPage = Math.min(paymentPage, paymentTotalPages)
  const paymentStart = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + 1
  const paymentEnd = Math.min(currentPaymentPage * PAYMENTS_PER_PAGE, filteredPayments.length)
  const paginatedPayments = filteredPayments.slice((currentPaymentPage - 1) * PAYMENTS_PER_PAGE, currentPaymentPage * PAYMENTS_PER_PAGE)

  const pickupTotalPages = Math.max(1, Math.ceil(filteredPickups.length / PICKUPS_PER_PAGE))
  const currentPickupPage = Math.min(pickupPage, pickupTotalPages)
  const pickupStart = (currentPickupPage - 1) * PICKUPS_PER_PAGE + 1
  const pickupEnd = Math.min(currentPickupPage * PICKUPS_PER_PAGE, filteredPickups.length)
  const paginatedPickups = filteredPickups.slice((currentPickupPage - 1) * PICKUPS_PER_PAGE, currentPickupPage * PICKUPS_PER_PAGE)

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
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col flex-1">
      <VerifyPickupModal
        isOpen={!!verifyModal}
        onClose={() => setVerifyModal(null)}
        type={verifyModal?.type ?? null}
        item={verifyModal?.item ? {
          id: verifyModal.item.id,
                        customerName: String("customerName" in verifyModal.item ? verifyModal.item.customerName ?? "Unknown" : "Unknown"),
          referenceNumber: "referenceNumber" in verifyModal.item ? verifyModal.item.referenceNumber : undefined,
          amount: "amount" in verifyModal.item ? verifyModal.item.amount : undefined,
          code: "code" in verifyModal.item ? verifyModal.item.code : undefined,
          date: verifyModal.item.date,
        } : null}
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
        reservation={cancelPickupModal ? { customerName: cancelPickupModal.customerName, totalAmount: 0 } : null}
        loading={false}
      />

      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab("payments")}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === "payments" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Payments to Verify
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">{payments.filter((p) => p.status === "pending").length}</span>
          </button>
          <button
            onClick={() => setActiveTab("pickups")}
            className={cn(
              "flex-1 px-6 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
              activeTab === "pickups" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
            )}
          >
            <Package className="w-4 h-4" />
            Orders for Pickup
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 border border-amber-200">{pickups.filter((p) => p.status === "ready").length}</span>
          </button>
        </div>
      </div>

      {activeTab === "payments" && (
        <div className="flex flex-col flex-1">
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search payments by reference or customer..."
                value={paymentSearch}
                onChange={(e) => { setPaymentSearch(e.target.value); setPaymentPage(1) }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Order</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Customer</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Reference</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Method</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Amount</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedPayments.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">No payments found</td></tr>
                ) : (
                  paginatedPayments.map((p, index) => {
                    const globalIndex = (currentPaymentPage - 1) * PAYMENTS_PER_PAGE + index
                    return (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">ORD-{String(globalIndex + 1).padStart(3, '0')}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{p.customerName || "—"}</td>
                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.referenceNumber}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] uppercase border", p.method === "gcash" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", p.method === "gcash" ? "bg-emerald-500" : "bg-amber-500")} />
                            {p.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-foreground">₱{p.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border", p.status === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200")}>
                            {p.status === "verified" ? <CheckCircle2 className="w-3 h-3" /> : p.status === "pending" ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === "pending" ? (
                            <button onClick={() => setVerifyModal({ type: "payment", item: p })} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/95 transition-colors shadow-xs">Verify</button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-medium">Verified</span>
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
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/5">
              <p className="text-xs text-muted-foreground font-medium">
                Showing {paymentStart} to {paymentEnd} of {filteredPayments.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaymentPage(currentPaymentPage - 1)}
                  disabled={currentPaymentPage <= 1}
                  className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
                  Page {currentPaymentPage} of {paymentTotalPages}
                </span>
                <button
                  onClick={() => setPaymentPage(currentPaymentPage + 1)}
                  disabled={currentPaymentPage >= paymentTotalPages}
                  className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "pickups" && (
        <div className="flex flex-col flex-1">
          <div className="p-6 border-b border-border bg-muted/20">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pickups by customer or code..."
                value={pickupSearch}
                onChange={(e) => { setPickupSearch(e.target.value); setPickupPage(1) }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Order</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Customer</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Code</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Date</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginatedPickups.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No pickups found</td></tr>
                ) : (
                  paginatedPickups.map((p, index) => {
                    const globalIndex = (currentPickupPage - 1) * PICKUPS_PER_PAGE + index
                    return (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-sm text-foreground">ORD-{String(globalIndex + 1).padStart(3, '0')}</td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{p.customerName}</td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-foreground">{p.code}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border", p.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                            {p.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {p.status === "completed" ? "Completed" : "Ready"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.status === "ready" ? (
                              <button onClick={() => setVerifyModal({ type: "pickup", item: p })} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/95 transition-colors shadow-xs">Complete Pickup</button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium">Done</span>
                            )}
                            {p.status === "ready" && isOverdue(p.pickupDeadline) && onCancelPickup && (
                              <button
                                onClick={() => setCancelPickupModal(p)}
                                className="p-1.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                title="Cancel overdue pickup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/5">
              <p className="text-xs text-muted-foreground font-medium">
                Showing {pickupStart} to {pickupEnd} of {filteredPickups.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPickupPage(currentPickupPage - 1)}
                  disabled={currentPickupPage <= 1}
                  className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
                  Page {currentPickupPage} of {pickupTotalPages}
                </span>
                <button
                  onClick={() => setPickupPage(currentPickupPage + 1)}
                  disabled={currentPickupPage >= pickupTotalPages}
                  className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
