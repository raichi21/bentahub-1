"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Bell, LogIn } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
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

const ROUTE_TITLES: Record<string, string> = {
  "/customer": "Dashboard",
  "/customer/catalog": "Products",
  "/customer/catalog/[id]": "Products",
  "/customer/cart": "Cart",
  "/customer/checkout": "Checkout",
  "/customer/reservations": "Pickups",
  "/customer/orders": "Transaction History",
  "/customer/notifications": "Notifications",
  "/customer/profile": "Profile",
}

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  "/customer": "Browse, reserve, and track your orders",
  "/customer/catalog": "Browse products and add them to your cart",
  "/customer/catalog/[id]": "Product details and stock information",
  "/customer/cart": "Review your selected items",
  "/customer/checkout": "Complete your reservation",
  "/customer/reservations": "Track your scheduled pickups",
  "/customer/orders": "View your completed and past orders",
  "/customer/notifications": "Stay updated with your latest activities",
  "/customer/profile": "Manage your personal information",
}

export function DashboardTopbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const displayName = user?.fullName || ""
  const initials = displayName ? getInitials(displayName) : "U"

  const title = ROUTE_TITLES[pathname] || "Dashboard"
  const description = ROUTE_DESCRIPTIONS[pathname] || ""

  return (
    <header className="sticky top-0 z-30 flex h-[80px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-[#090e1a]">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-xl leading-tight font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        <ThemeToggle />

        {user ? (
          <>
            {/* Notifications */}
            <button
              onClick={() => router.push("/customer/notifications")}
              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900",
                    unreadCount > 9 ? "h-5 min-w-[20px] px-1" : "h-5 w-5"
                  )}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Vertical Divider */}
            <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />

            {/* User Pill */}
            <div className="flex items-center gap-3 select-none">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm leading-tight font-bold text-slate-800 dark:text-slate-200">
                  {displayName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  Customer
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Guest: Sign In button */
          <Button
            size="sm"
            onClick={() => router.push("/login")}
            className="flex-shrink-0 gap-1.5"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}
