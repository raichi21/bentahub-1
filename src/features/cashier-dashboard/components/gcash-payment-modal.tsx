"use client"

import { useState } from "react"
import { X, QrCode, Loader2, RefreshCw } from "lucide-react"

interface GcashPaymentModalProps {
  checkoutUrl: string
  amount: number
  receiptNumber: number
  paymentIntentId: string
  transactionId: string
  token: string | null
  onSuccess: () => void
  onClose: () => void
}

export function GcashPaymentModal({
  checkoutUrl,
  amount,
  receiptNumber,
  paymentIntentId,
  token,
  onSuccess,
  onClose,
}: GcashPaymentModalProps) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")

  const handleCheckStatus = async () => {
    setChecking(true)
    setError("")

    try {
      const res = await fetch(
        `/api/cashier/payments/check?paymentIntentId=${paymentIntentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const json = await res.json()

      if (json.success && json.data.isPaid) {
        onSuccess()
      } else {
        setError("Payment not yet received. Ask customer to scan the QR code.")
      }
    } catch {
      setError("Failed to check payment status")
    } finally {
      setChecking(false)
    }
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(checkoutUrl)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm animate-in overflow-hidden rounded-2xl bg-card shadow-2xl duration-200 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground">
              GCash Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center space-y-4 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            Ipakita ang QR sa customer para i-scan gamit ang GCash app
          </p>

          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="GCash QR Code" className="h-64 w-64" />
          </div>

          <div className="space-y-1">
            <p className="font-mono text-2xl font-black text-card-foreground">
              ₱{amount.toFixed(2)}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Receipt #{receiptNumber}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p className="w-full rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-500">
              {error}
            </p>
          )}

          {/* Check payment button */}
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {checking ? "Checking..." : "Check Payment Status"}
          </button>

          <p className="text-[10px] text-muted-foreground">
            After customer pays, click the button above to confirm.
          </p>
        </div>
      </div>
    </div>
  )
}
