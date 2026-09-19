"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

type OrderStatus =
  | "pending"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled"

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
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
            <X className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-bold text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">
              This order has been cancelled and is no longer active.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/5">
                  <X className="h-4 w-4 text-destructive/50" />
                </div>
                <span className="mt-1 text-xs text-destructive/50">
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-px flex-1 bg-destructive/20" />
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
            <div
              key={step.key}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20"
                  )}
                >
                  {isActive && i < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-1 flex-1 rounded-full",
                    i < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {status === "pending" &&
          "Your order has been placed and is awaiting processing."}
        {status === "processing" &&
          "Your order is being prepared by our staff."}
        {status === "ready" && "Your order is ready for pickup at the branch!"}
        {status === "completed" && "Your order has been picked up. Thank you!"}
      </p>
    </div>
  )
}
