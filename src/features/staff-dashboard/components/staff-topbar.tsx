"use client"

import { usePathname, useRouter } from "next/navigation"
import { Bell, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const ROUTE_TITLES: Record<string, string> = {
  "/staff": "Dashboard Overview",
  "/staff/monitoring": "Transaction Monitoring",
  "/staff/notifications": "Notifications",
  "/staff/inventory": "Inventory Updating",
  "/staff/history": "Transaction History",
  "/staff/pickup": "Payments & Pickup",
}

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/staff": "Overview of branch performance and key metrics",
  "/staff/monitoring": "Real-time transaction monitoring and updates",
  "/staff/notifications": "Manage operational alerts",
}

interface StaffTopbarProps {
  onToggleSidebar?: () => void
}

export function StaffTopbar({ onToggleSidebar }: StaffTopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const title = ROUTE_TITLES[pathname] || "Staff Dashboard"

  return (
    <header className="bg-card border-b border-border px-4 md:px-6 sticky top-0 z-30 flex justify-between items-center h-[80px] w-full">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors md:hidden flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
          {ROUTE_DESCRIPTIONS[pathname] && (
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{ROUTE_DESCRIPTIONS[pathname]}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        <button onClick={() => router.push("/staff/notifications")} aria-label="Notifications" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border relative flex-shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-card"></span>
        </button>

        <div className="h-8 w-px bg-border hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20 select-none flex-shrink-0">
            DC
          </div>
          <div className="flex-col hidden sm:flex">
            <span className="text-sm font-bold text-foreground leading-tight">Dolly Cruz</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Branch Staff
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
