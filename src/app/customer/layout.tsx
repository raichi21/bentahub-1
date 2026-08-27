"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  DashboardSidebar,
  DashboardTopbar,
  DashboardMobileNav
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Fixed on desktop */}
      <DashboardSidebar activePath={pathname} />

      {/* Main Content Area */}
      <div className="md:ml-[280px] flex flex-col min-h-screen">
        {/* Topbar - Sticky */}
        <DashboardTopbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <DashboardMobileNav activePath={pathname} />
      </div>
    </div>
  )
}
