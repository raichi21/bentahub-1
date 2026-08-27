"use client"

import Link from "next/link"
import { Home, Store, User, ShoppingCart } from "lucide-react"
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
      label: "Browse",
      icon: Store,
      path: "/catalog",
    },
    {
      label: "Cart",
      icon: ShoppingCart,
      path: "/customer/cart",
    },
    {
      label: "Profile",
      icon: User,
      path: "/customer/profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = activePath === item.path
        const Icon = item.icon
        
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-medium transition-colors",
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

