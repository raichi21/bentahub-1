"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AdminSidebar, AdminTopbar } from "@/features/admin-dashboard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, isLoading, isAuthenticated } = useAuth()

  // Protect admin routes — only users with role "admin"
  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login?redirect=/admin")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "admin") return null

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar activePath={pathname} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen md:ml-[280px] overflow-hidden">
        <AdminTopbar pathname={pathname} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
