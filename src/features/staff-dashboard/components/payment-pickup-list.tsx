"use client"

import { useState } from "react"
import { CreditCard, Package } from "lucide-react"
import { VerifyPickupModal } from "./verify-pickup-modal"
import { CancelReservationModal } from "./cancel-reservation-modal"
import { PaymentsSection } from "./payments-section"
import { PickupsSection } from "./pickups-section"
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
  const [verifyModal, setVerifyModal] = useState<{
    type: "payment" | "pickup"
    item: PaymentItem | PickupItem
  } | null>(null)
  const [cancelPickupModal, setCancelPickupModal] = useState<PickupItem | null>(
    null
  )

  const handleConfirm = (id: string) => {
    if (verifyModal?.type === "payment") onVerifyPayment(id)
    else onCompletePickup(id)
    setVerifyModal(null)
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
        <PaymentsSection
          payments={payments}
          onVerifyRequest={(item) => setVerifyModal({ type: "payment", item })}
        />
      )}

      {activeTab === "pickups" && (
        <PickupsSection
          pickups={pickups}
          onCompleteRequest={(item) => setVerifyModal({ type: "pickup", item })}
          onCancelRequest={
            onCancelPickup ? (item) => setCancelPickupModal(item) : undefined
          }
        />
      )}
    </div>
  )
}
