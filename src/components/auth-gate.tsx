"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

interface AuthGateProps {
  children: React.ReactNode
}

/**
 * Client-side auth guard for customer pages.
 * - Shows a spinner while the session is being verified.
 * - Redirects guests to /login (preserving the current path as a
 *   ?redirect= param) instead of rendering a blank screen.
 * - Renders children once authenticated.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const current = window.location.pathname + window.location.search
      router.replace(`/login?redirect=${encodeURIComponent(current)}`)
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isLoading ? "Verifying your session..." : "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
