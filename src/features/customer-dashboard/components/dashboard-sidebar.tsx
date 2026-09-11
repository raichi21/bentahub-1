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
  X
} from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  activePath: string
  isOpen?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ activePath, isOpen, onClose }: DashboardSidebarProps) {
  const router = useRouter()
  const { storeName } = useStoreSettings()

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
        { label: "Products", icon: Store, path: "/customer/catalog" },
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
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}

      <aside className={cn(
        "flex flex-col w-[280px] bg-[#0c1221] text-white fixed inset-y-0 left-0 z-40 border-r border-slate-900",
        "transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-3">
          <StoreLogo />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-lg tracking-tight truncate">{storeName}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Customer Portal</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors md:hidden flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
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
            href="/customer/profile"
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium",
              activePath === "/customer/profile"
                ? "bg-primary text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
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
    </>
  )
}

