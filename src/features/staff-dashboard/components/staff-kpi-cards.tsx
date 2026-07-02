"use client"

import { Package, AlertTriangle, ShoppingBag, TrendingUp } from "lucide-react"
import type { Product } from "@/types/cashier"
import { getStockStatus } from "@/lib/staff-utils"

interface StaffKpiCardsProps {
  products: Product[]
  lowStockCount: number
  pendingPickups: number
  todayRevenue: number
}

export function StaffKpiCards({ products, lowStockCount, pendingPickups, todayRevenue }: StaffKpiCardsProps) {
  const metrics = [
    {
      label: "Total Products Managed",
      value: products.length,
      subtext: `${products.filter((p) => getStockStatus(p) === "in-stock").length} in stock`,
      icon: Package,
      iconColor: "text-blue-500",
      subtextClass: "text-green-500",
    },
    {
      label: "Low Stock Warnings",
      value: lowStockCount,
      subtext: lowStockCount > 0 ? "Needs attention" : "All good",
      icon: AlertTriangle,
      iconColor: lowStockCount > 0 ? "text-red-500" : "text-muted-foreground",
      subtextClass: lowStockCount > 0 ? "text-red-500" : "text-green-500",
    },
    {
      label: "Pending Pickups",
      value: pendingPickups,
      subtext: `${pendingPickups} orders waiting`,
      icon: ShoppingBag,
      iconColor: "text-amber-500",
      subtextClass: "text-amber-500",
    },
    {
      label: "Today's Verified Transactions",
      value: `₱${todayRevenue.toFixed(2)}`,
      subtext: "Today's revenue",
      icon: TrendingUp,
      iconColor: "text-green-500",
      subtextClass: "text-green-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <div
            key={m.label}
            className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{m.label}</span>
              <Icon className={`w-5 h-5 ${m.iconColor}`} />
            </div>
            <div className="mt-2">
              <h3 className="text-3xl font-extrabold text-foreground">{m.value}</h3>
              <span className={`text-xs font-medium ${m.subtextClass}`}>{m.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
