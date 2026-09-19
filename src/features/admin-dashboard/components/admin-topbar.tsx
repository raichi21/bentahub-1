"use client"

import { useRouter } from "next/navigation"
import { Bell, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { useAdminNotifications } from "@/hooks/useAdminNotifications"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface AdminTopbarProps {
  pathname?: string
  onToggleSidebar?: () => void
}

export function AdminTopbar({
  pathname = "/admin",
  onToggleSidebar,
}: AdminTopbarProps) {
  const { unreadCount } = useAdminNotifications({ pollInterval: 0 })
  const { user } = useAuth()
  const router = useRouter()
  const displayName = user?.fullName || "Admin User"
  const initials = getInitials(displayName)
  let title = "Dashboard"
  let subtitle = ""

  if (pathname.includes("/admin/monitoring")) {
    title = "Centralized Monitoring"
    subtitle = "View inventory and sales across all branches in real-time"
  } else if (pathname.includes("/admin/sales")) {
    title = "Sales Report"
    subtitle = "View daily sales and transaction records across all branches."
  } else if (pathname.includes("/admin/products")) {
    title = "Product Management"
    subtitle =
      "Manage product categories, unit types, and the master product catalog."
  } else if (pathname.includes("/admin/users")) {
    title = "User Management"
    subtitle = "The admin allow to Add, Edit, Remove, and manage users"
  } else if (pathname.includes("/admin/payments")) {
    title = "Payment Management"
    subtitle = "Review and verify payments via cash and GCash"
  } else if (pathname.includes("/admin/history")) {
    title = "Transaction History"
    subtitle =
      "Review all past transactions from every branch, ensuring accurate record tracking and verification of sales."
  } else if (pathname.includes("/admin/pickups")) {
    title = "Pickup Management"
    subtitle = "Monitor and confirm pickups across all branches in real-time."
  } else if (pathname.includes("/admin/notifications")) {
    title = "Notifications"
    subtitle =
      "Manage and review recent system, inventory, and user activities."
  } else if (pathname.includes("/admin/settings")) {
    title = "Settings"
    subtitle = "Configure system settings and branches"
  }

  return (
    <header className="sticky top-0 z-30 flex h-[80px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-[#090e1a]">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex-shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-xl leading-tight font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={() => router.push("/admin/notifications")}
          aria-label="View notifications"
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 ${unreadCount > 9 ? "h-5 min-w-[20px] px-1" : "h-5 w-5"} flex items-center justify-center`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Vertical Divider - hidden on very small screens */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800"></div>

        {/* User Pill - show only initials on very small screens */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">
            {initials}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm leading-tight font-bold text-slate-800 dark:text-slate-200">
              {displayName}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
