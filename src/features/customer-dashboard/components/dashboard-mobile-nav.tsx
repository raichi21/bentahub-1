"use client"

import Link from "next/link"
import { Home, Store, User, ShoppingCart, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardMobileNavProps {
  activePath: string
}

export function DashboardMobileNav({ activePath }: DashboardMobileNavProps) {
  const navItems = [
    {
      label: "Home",
      icon: Home,
      path: "/customer",
    },
    {
      label: "Products",
      icon: Store,
      path: "/customer/catalog",
    },
    {
      label: "Cart",
      icon: ShoppingCart,
      path: "/customer/cart",
    },
    {
      label: "Pickups",
      icon: Calendar,
      path: "/customer/reservations",
    },
    {
      label: "Profile",
      icon: User,
      path: "/customer/profile",
    },
  ]

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background md:hidden">
      {navItems.map((item) => {
        const isActive = activePath === item.path
        const Icon = item.icon

        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
