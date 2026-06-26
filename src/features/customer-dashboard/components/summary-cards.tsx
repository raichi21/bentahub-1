"use client"

import Link from "next/link"
import { ShoppingBag, Calendar } from "lucide-react"
import { useOrders } from "@/hooks/useOrders"

export function SummaryCards() {
  const { orders } = useOrders()

  const totalOrders = orders.filter((o) => o.status !== "cancelled").length
  const activeReservations = orders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length

  const cards = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      iconBg: "bg-accent",
      iconColor: "text-accent-foreground",
      href: "/customer/orders",
    },
    {
      label: "Active Reservations",
      value: activeReservations,
      icon: Calendar,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      href: "/customer/reservations",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Link key={index} href={card.href}>
            <div 
              className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <div className={`size-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                <h3 className="text-2xl font-bold mt-0.5">{card.value}</h3>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
