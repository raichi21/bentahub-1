"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  History,
  Bell,
  ShoppingCart,
  Calendar,
  User,
  LogOut,
} from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activePath: string
}

export function DashboardSidebar({ activePath }: DashboardSidebarProps) {
  const router = useRouter()
  const { storeName } = useStoreSettings()

  const sections = [
    {
      title: "Dashboard",
      items: [
        { label: "Home", icon: LayoutDashboard, path: "/customer" },
        { label: "Notifications", icon: Bell, path: "/customer/notifications" },
      ],
    },
    {
      title: "Shop",
      items: [
        { label: "Products", icon: Store, path: "/customer/catalog" },
        { label: "Cart", icon: ShoppingCart, path: "/customer/cart" },
      ],
    },
    {
      title: "Records",
      items: [
        { label: "Pickups", icon: Calendar, path: "/customer/reservations" },
        {
          label: "Transaction History",
          icon: History,
          path: "/customer/orders",
        },
      ],
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-slate-900 bg-[#0c1221] text-white md:flex">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-8">
        <StoreLogo />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-lg font-bold tracking-tight">
            {storeName}
          </span>
          <span className="text-[10px] tracking-widest text-slate-400 uppercase">
            Customer Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="custom-scrollbar flex-1 overflow-y-auto px-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-4 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = activePath === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto p-4">
        <nav className="space-y-1">
          <Link
            href="/customer/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activePath === "/customer/profile"
                ? "bg-primary text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
