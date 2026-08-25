"use client"

import { useState } from "react"
import { CashierSidebar } from "@/features/cashier-dashboard/components/cashier-sidebar"
import { CashierTopbar } from "@/features/cashier-dashboard/components/cashier-topbar"
import { RoleGate } from "@/components/role-gate"

const ALLOWED_ROLES = ["cashier"]

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <RoleGate allow={ALLOWED_ROLES}>
      <div className="h-screen bg-background text-foreground flex overflow-hidden">
        <CashierSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col h-screen md:ml-[280px] overflow-hidden">
          <CashierTopbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </RoleGate>
  )
}
