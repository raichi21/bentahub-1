"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { AuthHeader } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyEmailAction, resendVerificationCodeAction } from "@/features/user-mgmt/actions/verify"

export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || (typeof window !== "undefined" ? sessionStorage.getItem("pendingVerificationEmail") : "") || ""

  const [code, setCode] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")
  const [canResend, setCanResend] = React.useState(true)
  const [resendCountdown, setResendCountdown] = React.useState(0)

  // Countdown timer for resend button
  React.useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      if (!code || code.length !== 6) {
        setError("Please enter a valid 6-digit code")
        setIsLoading(false)
        return
      }

      if (!email) {
        setError("Email not found. Please register again.")
        setIsLoading(false)
        return
      }

      const result = await verifyEmailAction({ email, code })

      if (!result.success) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      setSuccess(result.message)

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("pendingVerificationEmail")
        }
        router.push("/login?verified=true")
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Verification error:", err)
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError("")
    setSuccess("")
    setCanResend(false)
    setResendCountdown(60)
    setIsLoading(true)

    try {
      if (!email) {
        setError("Email is missing. Please register again.")
        setCanResend(true)
        setResendCountdown(0)
        setIsLoading(false)
        return
      }

      const result = await resendVerificationCodeAction({ email })

      if (!result.success) {
        setError(result.message)
        setCanResend(true)
        setResendCountdown(0)
        setIsLoading(false)
        return
      }

      setSuccess(result.message)
      setIsLoading(false)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setCanResend(true)
      setResendCountdown(0)
      console.error("Resend error:", err)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AuthHeader subtitle="Verify your email address" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            We&apos;ve sent a verification code to <span className="font-medium text-foreground">{email || "your email"}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg animate-in fade-in duration-200">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg animate-in fade-in duration-200">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                className="text-center font-mono text-3xl tracking-widest p-6 h-14"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground text-center mt-1">Enter the 6-digit code we sent you</p>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full p-5" disabled={isLoading || code.length !== 6}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 space-y-3 border-t border-border pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the code?
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
            >
              {resendCountdown > 0 ? (
                `Resend code in ${resendCountdown}s`
              ) : (
                "Resend Code"
              )}
            </Button>

            <Link href="/register" className="block text-center mt-2">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="size-4" />
                Back to Registration
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
