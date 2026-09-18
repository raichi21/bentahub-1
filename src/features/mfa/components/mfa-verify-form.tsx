"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, KeyRound, ArrowLeft } from "lucide-react"
import { AuthHeader } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import type { AuthUser } from "@/components/auth-provider"
import type { MfaVerifyResponseData } from "@/types/auth"

const PENDING_MFA_KEY = "pendingMfaToken"

function getPendingMfaToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(PENDING_MFA_KEY)
}

/** Navigate to the dashboard for the given role after authentication. */
function redirectByRole(
  router: ReturnType<typeof useRouter>,
  role: string
): void {
  if (role === "admin") router.push("/admin")
  else if (role === "staff") router.push("/staff")
  else if (role === "cashier") router.push("/cashier")
  else router.push("/customer")
}

type MfaVerifyResponse = {
  success: boolean
  message?: string
  data?: MfaVerifyResponseData
}

/** Build the AuthUser object stored client-side after MFA verification. */
function toAuthUser(data: MfaVerifyResponseData): AuthUser {
  return {
    userId: data.user.userId,
    email: data.user.email,
    fullName: data.user.fullName,
    phone: data.user.phone,
    image: data.user.image,
    branch: data.user.branch,
    role: data.user.role,
    isEmailVerified: data.user.isEmailVerified,
  }
}

/**
 * Second authentication step: asks for the 6-digit TOTP (or a backup code)
 * after the password / OAuth step. Lives behind the pending-mfa token.
 */
export function MfaVerifyForm() {
  const router = useRouter()
  const { setToken, setUser } = useAuth()
  const [mfaToken, setMfaToken] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [useBackup, setUseBackup] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    setMfaToken(getPendingMfaToken())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const token = mfaToken ?? getPendingMfaToken()
    if (!token) {
      setError("Your sign-in session has expired. Please sign in again.")
      return
    }

    if (!/^\d{6}$/.test(code) && !useBackup) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken: token, code }),
      })

      const data = (await response
        .json()
        .catch(() => null)) as MfaVerifyResponse | null

      if (!response.ok) {
        const message = data?.message || "Verification failed"
        setError(message)
        if (response.status === 429) {
          sessionStorage.removeItem(PENDING_MFA_KEY)
          setTimeout(() => router.push("/login"), 1200)
        }
        setIsLoading(false)
        return
      }

      if (!data?.success || !data.data?.token) {
        setError(data?.message || "Verification failed")
        setIsLoading(false)
        return
      }

      sessionStorage.removeItem(PENDING_MFA_KEY)
      setToken(data.data.token)
      setUser(toAuthUser(data.data))
      redirectByRole(router, data.data.user.role)
    } catch (err) {
      console.error("MFA verify error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (mfaToken === null) {
    return (
      <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
        <AuthHeader subtitle="Two-factor authentication" />
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <ShieldCheck className="mx-auto size-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              Your sign-in session has expired. Please sign in again to
              continue.
            </p>
            <Link href="/login">
              <Button className="w-full gap-2">
                <ArrowLeft className="size-4" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Two-step verification" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            {useBackup ? "Enter a backup code" : "Enter your code"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-8 w-8 animate-pulse text-primary" />
            </div>
          </div>

          <p className="mb-6 text-center text-sm text-muted-foreground">
            Open your authenticator app and enter the 6-digit code to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="code"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                {useBackup ? "Backup Code" : "Verification Code"}
              </Label>
              <Input
                id="code"
                type="text"
                inputMode={useBackup ? "text" : "numeric"}
                placeholder={useBackup ? "XXXX-XXXX" : "000000"}
                className="h-14 p-6 text-center font-mono text-3xl tracking-widest"
                maxLength={useBackup ? 9 : 6}
                value={code}
                onChange={(e) =>
                  setCode(
                    useBackup
                      ? e.target.value
                          .replace(/[^A-Za-z0-9]/g, "")
                          .toUpperCase()
                          .slice(0, 9)
                      : e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                disabled={isLoading}
                autoFocus
                required
              />
              <p className="mt-1 text-center text-xs text-muted-foreground">
                {useBackup
                  ? "Used a one-time backup code from when you set up MFA"
                  : "6-digit code from your authenticator app"}
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full p-5" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          </form>

          <div className="mt-4 border-t border-border pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackup((prev) => !prev)
                setCode("")
                setError("")
              }}
              className="text-sm text-primary hover:underline"
            >
              {useBackup
                ? "Use an authenticator code instead"
                : "Use a backup code instead"}
            </button>
          </div>

          <Link href="/login" className="mt-2 block">
            <Button variant="ghost" className="w-full gap-2">
              <ArrowLeft className="size-4" />
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
