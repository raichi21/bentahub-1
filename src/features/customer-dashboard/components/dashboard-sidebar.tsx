"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  History,
  Bell,
  Store as StoreIcon,
  ShoppingCart,
  Calendar,
  Settings,
  LogOut
} from "lucide-react"
import { APP_NAME } from "@/config"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activePath: string
}

export function DashboardSidebar({ activePath }: DashboardSidebarProps) {
  const router = useRouter()

  const sections = [
    {
      title: "Dashboard",
      items: [
        { label: "Home", icon: LayoutDashboard, path: "/customer" },
        { label: "Notifications", icon: Bell, path: "/customer/notifications" },
      ]
    },
    {
      title: "Shop",
      items: [
        { label: "Browse Products", icon: Store, path: "/customer/catalog" },
        { label: "Cart", icon: ShoppingCart, path: "/customer/cart" },
      ]
    },
    {
      title: "Records",
      items: [
        { label: "My Reservations", icon: Calendar, path: "/customer/reservations" },
        { label: "Transaction History", icon: History, path: "/customer/orders" },
      ]
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
    <aside className="hidden md:flex flex-col w-[280px] bg-[#0c1221] text-white fixed inset-y-0 left-0 z-40">
      {/* Header */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <StoreIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-lg tracking-tight truncate">{APP_NAME}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Customer Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="px-4 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
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
      <div className="p-4 mt-auto">
        <nav className="space-y-1">
          <Link
            href="/customer/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium",
              activePath === "/customer/settings"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all text-sm font-medium w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}

