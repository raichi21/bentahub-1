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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            {isLoading
              ? "Verifying your session..."
              : "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
