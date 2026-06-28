"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type OrderStatus = "pending" | "processing" | "ready" | "completed" | "cancelled"

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
]

const STEP_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  processing: 1,
  ready: 2,
  completed: 3,
  cancelled: -1,
}

interface OrderTrackerProps {
  status: OrderStatus
}

export function OrderTracker({ status }: OrderTrackerProps) {
  const currentStep = STEP_INDEX[status]
  const isCancelled = status === "cancelled"

  if (isCancelled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <X className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-bold text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">This order has been cancelled and is no longer active.</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-destructive/30 flex items-center justify-center bg-destructive/5">
                  <X className="w-4 h-4 text-destructive/50" />
                </div>
                <span className="text-xs text-destructive/50 mt-1">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-destructive/20 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isActive = i <= currentStep
          const isCurrent = i === currentStep
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  {isActive && i < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1.5 font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full",
                    i < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {status === "pending" && "Your order has been placed and is awaiting processing."}
        {status === "processing" && "Your order is being prepared by our staff."}
        {status === "ready" && "Your order is ready for pickup at the branch!"}
        {status === "completed" && "Your order has been picked up. Thank you!"}
      </p>
    </div>
  )
}
