"use client"

import { useState } from "react"
import { X, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type ModalStep = "confirm" | "loading" | "success" | "error"

interface CancelOrderModalProps {
  orderId: string
  orderLabel: string
  amount: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CancelOrderModal({
  orderLabel,
  amount,
  isOpen,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [step, setStep] = useState<ModalStep>("confirm")
  const [errorMessage, setErrorMessage] = useState("")

  if (!isOpen) return null

  const handleCancel = async () => {
    setStep("loading")
    try {
      await onConfirm()
      setStep("success")
      setTimeout(onClose, 2000)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to cancel order"
      )
      setStep("error")
    }
  }

  const handleClose = () => {
    setStep("confirm")
    setErrorMessage("")
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={
          step === "loading" || step === "success" ? undefined : handleClose
        }
      />
      <div className="relative mx-4 w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading text-base font-bold">
            {step === "success"
              ? "Cancelled"
              : step === "error"
                ? "Error"
                : "Cancel Order"}
          </h2>
          {step !== "loading" && step !== "success" && (
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {step === "confirm" && (
          <div className="space-y-5 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-bold">Cancel this order?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This cannot be undone. The order{" "}
                <span className="font-mono font-medium">{orderLabel}</span> will
                be cancelled.
              </p>
              <p className="mt-3 text-lg font-bold">{amount}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
              >
                Yes
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cancelling order...</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Order Cancelled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {orderLabel} has been cancelled.
              </p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-semibold">Failed to Cancel</p>
              {errorMessage && (
                <p className="mt-1 text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setStep("confirm")}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
