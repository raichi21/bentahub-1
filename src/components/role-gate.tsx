"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

/** Home dashboard route for each role. */
const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  staff: "/staff",
  cashier: "/cashier",
  customer: "/customer",
}

interface RoleGateProps {
  children: React.ReactNode
  /** Roles permitted to view the wrapped content. */
  allow: string[]
}

/**
 * Client-side role guard.
 * - Guests are redirected to /login (preserving the current path).
 * - Authenticated users whose role is not in `allow` are bounced to their
 *   own role home so they never see another area's UI.
 * - Renders children once the role check passes.
 */
export function RoleGate({ children, allow }: RoleGateProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated, user } = useAuth()

  const role = user?.role ?? ""
  const allowed = isAuthenticated && allow.includes(role)
  const allowKey = allow.join("|")

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const current = window.location.pathname + window.location.search
      router.replace(`/login?redirect=${encodeURIComponent(current)}`)
      return
    }
    if (!allowKey.split("|").includes(role)) {
      router.replace(ROLE_HOME[role] ?? "/customer")
    }
  }, [isLoading, isAuthenticated, role, allowKey, router])

  if (isLoading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isLoading ? "Verifying your session..." : "Redirecting..."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
