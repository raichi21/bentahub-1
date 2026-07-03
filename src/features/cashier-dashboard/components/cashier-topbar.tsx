"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface CashierTopbarProps {
  onToggleSidebar?: () => void
}

export function CashierTopbar({ onToggleSidebar }: CashierTopbarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "CA"

  let title = "POS System"
  if (pathname === "/cashier/stock-check") {
    title = "Stock Check"
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 sticky top-0 z-30 flex justify-between items-center h-[80px] w-full">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors md:hidden flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        {/* User Pill */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/20 select-none flex-shrink-0">
            {userInitials}
          </div>
          <div className="flex-col hidden sm:flex">
            <span className="text-sm font-bold text-slate-800 leading-tight">{user?.fullName || "Cashier"}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Cashier
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
