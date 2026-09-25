"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Activity,
  Bell,
  PackageSearch,
  CheckCircle2,
  Calendar,
  LogOut,
  X,
} from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"
import { NotificationBadge } from "./notification-badge"

const NAV_ITEMS = [
  {
    category: "Dashboard",
    links: [{ href: "/staff", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    category: "Operations",
    links: [
      {
        href: "/staff/monitoring",
        label: "Transaction Monitoring",
        icon: Activity,
      },
      { href: "/staff/notifications", label: "Notifications", icon: Bell },
      {
        href: "/staff/inventory",
        label: "Inventory Stock",
        icon: PackageSearch,
      },
      { href: "/staff/reservations", label: "Reservations", icon: Calendar },
      {
        href: "/staff/pickup",
        label: "Payments & Pickups",
        icon: CheckCircle2,
      },
    ],
  },
]

interface StaffSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function StaffSidebar({ isOpen, onClose }: StaffSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { storeName } = useStoreSettings()

  const handleNav = () => {
    onClose()
  }

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
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-900 bg-[#0c1221] text-white",
          "transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-6 py-8">
          <StoreLogo boxClassName="bg-blue-600 shadow-lg shadow-blue-600/30" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-lg font-bold tracking-tight">
              {storeName}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Staff Panel
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {group.category}
              </p>
              <nav className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleNav}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                        isActive
                          ? "border-l-4 border-blue-600 bg-blue-600/20 font-semibold text-white"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-blue-500" : "text-slate-400"
                        )}
                      />
                      <span>{link.label}</span>
                      {link.href === "/staff/notifications" && (
                        <NotificationBadge />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-slate-800/80 p-4">
          <nav className="space-y-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
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
