"use client"

import { usePathname, useRouter } from "next/navigation"
import { Bell, Menu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/theme-toggle"

const ROUTE_TITLES: Record<string, string> = {
  "/staff": "Dashboard Overview",
  "/staff/monitoring": "Transaction Monitoring",
  "/staff/notifications": "Notifications",
  "/staff/inventory": "Inventory Updating",
  "/staff/pickup": "Payments & Pickups",
  "/staff/reservations": "Reservations",
}

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/staff": "Overview of branch performance and key metrics",
  "/staff/monitoring": "Real-time transaction monitoring and updates",
  "/staff/inventory": "Manage and update product stock levels",
  "/staff/notifications": "Manage operational alerts",
  "/staff/pickup": "Verify payments and manage order pickups",
  "/staff/reservations": "Manage customer reservations for your branch",
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface StaffTopbarProps {
  onToggleSidebar?: () => void
}

export function StaffTopbar({ onToggleSidebar }: StaffTopbarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const title = ROUTE_TITLES[pathname] || "Staff Dashboard"
  const displayName = user?.fullName || "Branch Staff"
  const initials = getInitials(displayName)

  return (
    <header className="sticky top-0 z-30 flex h-[80px] w-full items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="truncate text-xl font-bold text-foreground">
            {title}
          </h1>
          {ROUTE_DESCRIPTIONS[pathname] && (
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              {ROUTE_DESCRIPTIONS[pathname]}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        <button
          onClick={() => router.push("/staff/notifications")}
          aria-label="Notifications"
          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card"></span>
        </button>

        <div className="hidden h-8 w-px bg-border sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20 select-none">
            {initials}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm leading-tight font-bold text-foreground">
              {displayName}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {user?.branch || "Branch Staff"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
