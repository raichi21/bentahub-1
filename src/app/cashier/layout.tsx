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
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <CashierSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex h-screen flex-1 flex-col overflow-hidden md:ml-[280px]">
          <CashierTopbar
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <main className="flex flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </RoleGate>
  )
}
