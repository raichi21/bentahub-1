"use client"

import { useState } from "react"
import { StaffSidebar } from "@/features/staff-dashboard/components/staff-sidebar"
import { StaffTopbar } from "@/features/staff-dashboard/components/staff-topbar"
import { RoleGate } from "@/components/role-gate"

const ALLOWED_ROLES = ["staff"]

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <RoleGate allow={ALLOWED_ROLES}>
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
        <StaffSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-h-screen md:ml-[280px] overflow-hidden">
          <StaffTopbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGate>
  )
}
