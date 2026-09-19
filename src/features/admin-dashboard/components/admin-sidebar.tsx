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
  Banknote,
  Package,
} from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  activePath: string
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({
  activePath,
  isOpen,
  onClose,
}: AdminSidebarProps) {
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
      items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/admin" }],
    },
    {
      title: "Management",
      items: [
        { label: "Monitoring", icon: Activity, path: "/admin/monitoring" },
        { label: "Products", icon: Package, path: "/admin/products" },
        { label: "Notifications", icon: Bell, path: "/admin/notifications" },
        { label: "Sales", icon: Tag, path: "/admin/sales" },
        { label: "User Management", icon: Users, path: "/admin/users" },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Payments", icon: CreditCard, path: "/admin/payments" },
        { label: "Cash Drawer", icon: Banknote, path: "/admin/cash-drawer" },
        { label: "Transaction History", icon: History, path: "/admin/history" },
        { label: "Pickups", icon: Truck, path: "/admin/pickups" },
      ],
    },
  ]

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-[#0c1221] text-white",
          "transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-8">
          <StoreLogo />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-bold tracking-tight">
              {storeName}
            </span>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase">
              Admin Panel
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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
                      onClick={onClose}
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
              href="/admin/settings"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activePath === "/admin/settings"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                handleLogout()
                onClose()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
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
