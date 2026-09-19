"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import type { AuthUser } from "@/components/auth-provider"

/**
 * /oauth-result
 *
 * Landing page after a successful (or failed) social sign-in. The OAuth
 * callback route redirects here with the JWT in the query string; this page
 * persists it into the auth context (localStorage) and immediately scrubs the
 * URL so the token does not linger in browser history.
 */
export default function OAuthResultPage() {
  return (
    <Suspense fallback={<OAuthResultLoading />}>
      <OAuthResultInner />
    </Suspense>
  )
}

function OAuthResultLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-muted-foreground">Completing your sign-in...</p>
      </div>
    </div>
  )
}

function OAuthResultInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setToken, setUser } = useAuth()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const token = searchParams.get("token")
    const error = searchParams.get("oauth_error")
    const mfaToken = searchParams.get("mfaToken")

    // Scrub token/error from the URL as soon as we read them.
    router.replace("/oauth-result", { scroll: false })

    if (error) {
      router.replace(`/login?oauth_error=${encodeURIComponent(error)}`)
      return
    }

    // MFA challenge: stash the short-lived token and continue on the
    // dedicated verify screen (which also handles first-time enrollment).
    if (mfaToken) {
      sessionStorage.setItem("pendingMfaToken", mfaToken)
      router.replace("/mfa-verify")
      return
    }

    if (!token) {
      router.replace("/login?oauth_error=Missing%20token")
      return
    }

    try {
      // Decode the JWT payload (base64url middle segment) to route by role.
      const payload = JSON.parse(atob(token.split(".")[1])) as {
        userId?: string
        email?: string
        fullName?: string
        role?: string
      }

      const user: AuthUser = {
        userId: payload.userId ?? "",
        email: payload.email ?? "",
        fullName: payload.fullName ?? "",
        phone: null,
        image: null,
        branch: null,
        role: payload.role ?? "customer",
        isEmailVerified: true,
        canManageUnits: false,
        canManageCategories: false,
        canManageProducts: false,
      }

      setToken(token)
      setUser(user)

      const role = user.role
      if (role === "admin") router.replace("/admin")
      else if (role === "staff") router.replace("/staff")
      else if (role === "cashier") router.replace("/cashier")
      else router.replace("/customer")
    } catch (err) {
      console.error("Failed to decode OAuth token:", err)
      router.replace("/login?oauth_error=Invalid%20session%20token")
    }
  }, [router, searchParams, setToken, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-muted-foreground">Completing your sign-in...</p>
      </div>
    </div>
  )
}
