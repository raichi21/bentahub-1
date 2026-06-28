"use client"

import { useRouter } from "next/navigation"
import { Bell, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/useAuth"
import { useNotifications } from "@/hooks/useNotifications"
import { cn } from "@/lib/utils"

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

interface DashboardTopbarProps {
  onToggleSidebar?: () => void
}

export function DashboardTopbar({ onToggleSidebar }: DashboardTopbarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const displayName = user?.fullName || ""
  const initials = displayName ? getInitials(displayName) : "U"

  return (
    <header className="bg-white dark:bg-[#090e1a] border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 sticky top-0 z-30 flex justify-between items-center h-[80px] w-full">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">Customer Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">Browse, reserve, and track your orders</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={() => router.push("/customer/notifications")}
          className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-800 relative flex-shrink-0"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 flex items-center justify-center",
              unreadCount > 9 ? "min-w-[20px] h-5 px-1" : "w-5 h-5"
            )}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User Pill */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-col hidden sm:flex">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{displayName}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Customer</span>
          </div>
        </div>
      </div>
    </header>
  )
}
