"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Activity,
  Bell,
  Tag,
  Users,
  CreditCard,
  History,
  Truck,
  Settings,
  LogOut,
  X,
  Banknote
} from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  activePath: string
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ activePath, isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const { storeName } = useStoreSettings()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Proceed even if API call fails
    }
    router.push("/login")
  }

  const sections = [
    {
      title: "Dashboard",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      ]
    },
    {
      title: "Management",
      items: [
        { label: "Monitoring", icon: Activity, path: "/admin/monitoring" },
        { label: "Notifications", icon: Bell, path: "/admin/notifications" },
        { label: "Sales", icon: Tag, path: "/admin/sales" },
        { label: "User Management", icon: Users, path: "/admin/users" },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "Payments", icon: CreditCard, path: "/admin/payments" },
        { label: "Cash Drawer", icon: Banknote, path: "/admin/cash-drawer" },
        { label: "Transaction History", icon: History, path: "/admin/history" },
        { label: "Pickups", icon: Truck, path: "/admin/pickups" },
      ]
    }
  ]

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}

      <aside className={cn(
        "w-[280px] bg-[#0c1221] text-white flex flex-col fixed inset-y-0 left-0 z-40",
        "transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-3">
        <StoreLogo />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-lg tracking-tight truncate">{storeName}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Admin Panel</span>
        </div>
          <button onClick={onClose} aria-label="Close sidebar" className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden">
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
                      onClick={onClose}
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
              href="/admin/settings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                activePath === "/admin/settings"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => { handleLogout(); onClose(); }}
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
