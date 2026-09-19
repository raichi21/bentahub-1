"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ThemeToggle } from "@/components/theme-toggle"

interface CashierTopbarProps {
  onToggleSidebar?: () => void
}

export function CashierTopbar({ onToggleSidebar }: CashierTopbarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CA"

  let title = "POS System"
  if (pathname === "/cashier/stock-check") {
    title = "Stock Check"
  }

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
        <h1 className="truncate text-2xl font-bold text-card-foreground">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <ThemeToggle />
        {/* User Pill */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white shadow-md shadow-primary/20 select-none">
            {userInitials}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm leading-tight font-bold text-card-foreground">
              {user?.fullName || "Cashier"}
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {user?.branch || "Cashier"}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
