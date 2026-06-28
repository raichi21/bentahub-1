"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import {
  DashboardSidebar,
  DashboardTopbar,
  DashboardMobileNav
} from "@/features/customer-dashboard"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Show loading state while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your session...</p>
        </div>
      </div>
    )
  }

  // This component will not render if not authenticated (useAuth redirects)
  if (!isAuthenticated) {
    return null
  }

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
