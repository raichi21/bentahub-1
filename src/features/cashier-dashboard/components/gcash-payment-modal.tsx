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
      const res = await fetch(`/api/cashier/payments/check?paymentIntentId=${paymentIntentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm text-card-foreground">GCash Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <p className="text-xs text-muted-foreground">
            Ipakita ang QR sa customer para i-scan gamit ang GCash app
          </p>

          <div className="bg-card p-3 rounded-xl border border-border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="GCash QR Code"
              className="w-64 h-64"
            />
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-black text-card-foreground font-mono">
              ₱{amount.toFixed(2)}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              Receipt #{receiptNumber}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[10px] font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg w-full">
              {error}
            </p>
          )}

          {/* Check payment button */}
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
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
