"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrders } from "@/hooks/useOrders"
import {
  TransactionFilters,
  TransactionTable
} from "@/features/customer-dashboard"

const HISTORY_TABS = ["All", "Completed", "Cancelled"]

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const { fetchOrders } = useOrders()
  const [activeTab, setActiveTab] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const verified = useRef(false)

  useEffect(() => {
    if (verified.current) return
    const gcashSuccess = searchParams.get("gcash_success")
    const gcashCancelled = searchParams.get("gcash_cancelled")
    const paymentIntentId = searchParams.get("payment_intent_id")

    if (gcashSuccess) {
      verified.current = true
      // Use paymentIntentId from URL if available, otherwise server looks it up from order
      const query = paymentIntentId
        ? `paymentIntentId=${paymentIntentId}&orderId=${gcashSuccess}`
        : `orderId=${gcashSuccess}`
      fetch(`/api/customer/payments/check?${query}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.isPaid) {
            setBanner({ type: "success", message: "Payment successful! Your order is confirmed." })
            fetchOrders()
          } else {
            setBanner({ type: "error", message: "Payment pending. Please complete your GCash payment." })
          }
        })
        .catch(() => {
          setBanner({ type: "success", message: "Order placed! Please check your order status." })
        })
    } else if (gcashCancelled) {
      verified.current = true
      // Defer the banner update to avoid a synchronous setState inside the effect body.
      queueMicrotask(() => {
        setBanner({ type: "error", message: "GCash payment was cancelled. Your order is still pending — you can pay at pickup." })
      })
    }
  }, [searchParams, fetchOrders])

  return (
    <div className="space-y-6">
      {banner && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border text-sm",
          banner.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200"
            : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200"
        )}>
          {banner.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-amber-500" />
          )}
          <span className="flex-1">{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <TransactionFilters
        tabs={HISTORY_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
      />

      <TransactionTable filters={{ activeTab, searchQuery, dateFrom }} />
    </div>
  )
}
