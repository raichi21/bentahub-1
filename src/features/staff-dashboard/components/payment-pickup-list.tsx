"use client"

import { useState } from "react"
import { Search, CreditCard, Package, CheckCircle2, XCircle, Clock } from "lucide-react"
import { VerifyPickupModal } from "./verify-pickup-modal"
import { cn } from "@/lib/utils"

type Tab = "payments" | "pickups"

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
}

interface PaymentPickupListProps {
  payments: PaymentItem[]
  pickups: PickupItem[]
  onVerifyPayment: (paymentId: string) => void
  onCompletePickup: (pickupId: string) => void
}

export function PaymentPickupList({ payments, pickups, onVerifyPayment, onCompletePickup }: PaymentPickupListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("payments")
  const [paymentSearch, setPaymentSearch] = useState("")
  const [pickupSearch, setPickupSearch] = useState("")
  const [verifyModal, setVerifyModal] = useState<{ type: "payment" | "pickup"; item: PaymentItem | PickupItem } | null>(null)

  const filteredPayments = payments.filter((p) => {
    const q = paymentSearch.toLowerCase()
    return p.id.toLowerCase().includes(q) || p.referenceNumber.toLowerCase().includes(q) || (p.customerName?.toLowerCase().includes(q) ?? false)
  })

  const filteredPickups = pickups.filter((p) => {
    const q = pickupSearch.toLowerCase()
    return p.id.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
  })

  const handleConfirm = (id: string) => {
    if (verifyModal?.type === "payment") onVerifyPayment(id)
    else onCompletePickup(id)
    setVerifyModal(null)
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
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments by ID, reference, or customer..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment ID</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Method</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">No payments found</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-foreground">{p.id}</td>
                      <td className="p-4 text-xs text-muted-foreground">{p.customerName || "—"}</td>
                      <td className="p-4 text-xs font-mono text-muted-foreground">{p.referenceNumber}</td>
                      <td className="p-4 text-xs">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", p.method === "gcash" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>{p.method}</span>
                      </td>
                      <td className="p-4 text-sm font-mono font-bold text-foreground">₱{p.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", p.status === "verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200")}>
                          {p.status === "verified" ? <CheckCircle2 className="w-3 h-3" /> : p.status === "pending" ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "pending" ? (
                          <button onClick={() => setVerifyModal({ type: "payment", item: p })} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/95 transition-colors shadow-xs">Verify</button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pickups" && (
        <div className="flex flex-col flex-1">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search pickups by ID, customer, or code..."
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 border-b border-border">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Pickup ID</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredPickups.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">No pickups found</td></tr>
                ) : (
                  filteredPickups.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-xs font-mono font-bold text-foreground">{p.id}</td>
                      <td className="p-4 text-xs text-muted-foreground font-medium">{p.customerName}</td>
                      <td className="p-4 text-xs font-mono font-bold text-foreground">{p.code}</td>
                      <td className="p-4 text-xs text-muted-foreground font-mono">{new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="p-4">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", p.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                          {p.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {p.status === "completed" ? "Completed" : "Ready"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "ready" ? (
                          <button onClick={() => setVerifyModal({ type: "pickup", item: p })} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/95 transition-colors shadow-xs">Complete Pickup</button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
