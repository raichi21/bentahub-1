"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar, AdminTopbar } from "@/features/admin-dashboard"
import { RoleGate } from "@/components/role-gate"

const ALLOWED_ROLES = ["admin"]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <RoleGate allow={ALLOWED_ROLES}>
      <div className="min-h-screen bg-background">
      <AdminSidebar activePath={pathname} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen md:ml-[280px] overflow-hidden">
        <AdminTopbar pathname={pathname} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
    </RoleGate>
  )
}
