"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, ScanLine, ArrowLeft, Copy, Check } from "lucide-react"
import { AuthHeader } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import type { AuthUser } from "@/components/auth-provider"
import { BackupCodesDialog } from "./backup-codes-dialog"
import type { MfaSetupData, MfaVerifyResponseData } from "@/types/auth"

const PENDING_MFA_KEY = "pendingMfaToken"

function getPendingMfaToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(PENDING_MFA_KEY)
}

function redirectByRole(
  router: ReturnType<typeof useRouter>,
  role: string
): void {
  if (role === "admin") router.push("/admin")
  else if (role === "staff") router.push("/staff")
  else if (role === "cashier") router.push("/cashier")
  else router.push("/customer")
}

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

type MfaSetupResponse = {
  success: boolean
  message?: string
  data?: MfaSetupData
}

type MfaConfirmResponse = {
  success: boolean
  message?: string
  data?: MfaVerifyResponseData
}

/**
 * Forced first-time MFA enrollment performed right after the password /
 * OAuth step. Walks through: scan QR → enter code → save backup codes →
 * finish sign-in (full token is issued on confirmation).
 */
export function MfaSetupForm() {
  const router = useRouter()
  const { setToken, setUser } = useAuth()
  const [mfaToken, setMfaToken] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<"loading" | "enrolling" | "saved">(
    "loading"
  )
  const [setup, setSetup] = React.useState<MfaSetupData | null>(null)
  const [authData, setAuthData] = React.useState<MfaVerifyResponseData | null>(
    null
  )
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    const token = getPendingMfaToken()
    setMfaToken(token)

    if (!token) {
      setPhase("enrolling")
      return
    }

    let cancelled = false

    async function startSetup() {
      try {
        const response = await fetch("/api/auth/mfa/setup", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = (await response
          .json()
          .catch(() => null)) as MfaSetupResponse | null

        if (!response.ok || !data?.success || !data.data) {
          if (!cancelled) setError(data?.message || "Unable to start MFA setup")
        } else if (!cancelled) {
          setSetup(data.data)
        }
      } catch (err) {
        console.error("MFA setup start error:", err)
        if (!cancelled)
          setError("An unexpected error occurred. Please try again.")
      } finally {
        if (!cancelled)
          setPhase((prev) => (prev === "loading" ? "enrolling" : prev))
      }
    }

    startSetup()

    return () => {
      cancelled = true
    }
  }, [])

  const handleCopySecret = async () => {
    if (!setup) return
    try {
      await navigator.clipboard.writeText(setup.manualSecret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — ignore.
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const token = mfaToken ?? getPendingMfaToken()
    if (!token) {
      setError("Your sign-in session has expired. Please sign in again.")
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code")
      return
    }

    try {
      const response = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      const data = (await response
        .json()
        .catch(() => null)) as MfaConfirmResponse | null

      if (!response.ok || !data?.success || !data.data) {
        setError(data?.message || "Unable to enable MFA")
        return
      }

      setAuthData(data.data)

      // Profile/management flows confirm without issuing a token; the login
      // flow always carries one. Without a token, finish on the sign-in page.
      if (!data.data.token) {
        sessionStorage.removeItem(PENDING_MFA_KEY)
        setPhase("saved")
        router.push("/login")
        return
      }

      setPhase("saved")
    } catch (err) {
      console.error("MFA confirm error:", err)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleFinish = () => {
    if (!authData) return
    sessionStorage.removeItem(PENDING_MFA_KEY)
    if (authData.token) setToken(authData.token)
    setUser(toAuthUser(authData))
    redirectByRole(router, authData.user.role)
  }

  const expired = mfaToken === null

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Secure your account with two-factor authentication" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Set Up MFA</CardTitle>
        </CardHeader>
        <CardContent>
          {phase === "loading" && (
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {phase === "enrolling" && expired && (
            <div className="space-y-4 text-center">
              <ShieldCheck className="mx-auto size-10 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your sign-in session has expired. Please sign in again.
              </p>
              <Link href="/login">
                <Button className="w-full gap-2">
                  <ArrowLeft className="size-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}

          {phase === "enrolling" && !expired && (
            <div className="space-y-6">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {setup ? (
                <>
                  <div className="space-y-2 text-center">
                    <div className="inline-flex rounded-xl border border-border bg-background p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={setup.qrCodeDataUrl}
                        alt="Scan this QR code with your authenticator app"
                        width={200}
                        height={200}
                        className="h-48 w-48"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scan with Google Authenticator, Microsoft Authenticator,
                      or any TOTP app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                      Or enter this key manually
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-center font-mono text-xs tracking-wider break-all">
                        {setup.manualSecret}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopySecret}
                        aria-label="Copy secret key"
                      >
                        {copied ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <form
                    onSubmit={handleConfirm}
                    className="space-y-4 border-t border-border pt-4"
                  >
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="code"
                        className="text-xs tracking-wider text-muted-foreground uppercase"
                      >
                        Enter the 6-digit code
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        className="h-14 p-6 text-center font-mono text-3xl tracking-widest"
                        maxLength={6}
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        autoFocus
                        required
                      />
                      <p className="text-center text-xs text-muted-foreground">
                        Enter the code currently shown in your authenticator app
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 p-5"
                      disabled={code.length !== 6}
                    >
                      <ScanLine className="size-4" />
                      Verify and Enable
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {error
                    ? "Re-try setup by refreshing."
                    : "Preparing your authenticator setup..."}
                </p>
              )}
            </div>
          )}

          {phase === "saved" && authData?.backupCodes && (
            <div className="space-y-4">
              <BackupCodesDialog
                codes={authData.backupCodes}
                onConfirm={handleFinish}
              />
              <Link href="/login" className="block pt-2">
                <Button variant="ghost" className="w-full gap-2">
                  <ArrowLeft className="size-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
