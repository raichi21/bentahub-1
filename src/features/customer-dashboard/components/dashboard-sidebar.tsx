"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  Receipt,
  Bell,
  Store as StoreIcon,
  ShoppingCart,
  LogOut
} from "lucide-react"
import { APP_NAME } from "@/config"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activePath: string
}

export function DashboardSidebar({ activePath }: DashboardSidebarProps) {
  const router = useRouter()

  const navItems = [
    {
      label: "Home",
      icon: LayoutDashboard,
      path: "/customer",
    },
    {
      label: "Notifications",
      icon: Bell,
      path: "/customer/notifications",
    },
    {
      label: "Browse Catalog",
      icon: Store,
      path: "/customer/catalog",
    },
    {
      label: "Cart",
      icon: ShoppingCart,
      path: "/customer/cart",
    },
    {
      label: "Transaction History",
      icon: Receipt,
      path: "/customer/orders",
    },
  ]

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // proceed
    }
    router.push("/login")
  }

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-muted border-r border-border z-30">
      {/* Logo & Header */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border">
        <StoreIcon className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-bold text-lg tracking-tight">{APP_NAME}</h1>
          <p className="text-xs text-muted-foreground">Lourdes Sari-Sari Store</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activePath === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-primary font-bold"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full text-left"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}

