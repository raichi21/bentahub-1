"use client"

import { usePathname } from "next/navigation"
import {
  DashboardSidebar,
  DashboardTopbar,
  DashboardMobileNav,
} from "@/features/customer-dashboard"

/**
 * Customer shell layout. Auth is NOT enforced here so guests can browse
 * the public catalog at /catalog (landing area). Sensitive pages wrap
 * themselves in <RoleGate allow={["customer"]} />, which redirects guests
 * to /login and bounces non-customer roles to their own dashboard.
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Fixed on desktop */}
      <DashboardSidebar activePath={pathname} />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col md:ml-[280px]">
        {/* Topbar - Sticky */}
        <DashboardTopbar />

        {/* Page Content */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>

        {/* Mobile Bottom Nav */}
        <DashboardMobileNav activePath={pathname} />
      </div>
    </div>
  )
}
