"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { KeyRound, ArrowLeft } from "lucide-react"
import { AuthHeader } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialToken = searchParams.get("token") || ""

  const [token, setToken] = React.useState(initialToken)
  const paramEmail = searchParams.get("email")
  const sessionEmail =
    typeof window !== "undefined"
      ? sessionStorage.getItem("pendingResetEmail")
      : ""
  const [email] = React.useState(paramEmail || sessionEmail || "")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token || token.length !== 6) {
      setError("Please enter a valid 6-digit verification code")
      return
    }

    if (!email) {
      setError(
        "Email not found. Please start the forgot password process again."
      )
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Invalid or expired verification code")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(
          `/create-new-password?token=${token}&email=${encodeURIComponent(email)}`
        )
      }, 1500)
    } catch (err) {
      console.error("Verify reset code error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
        <AuthHeader subtitle="Almost done — redirecting you next" />

        <Card className="border-border shadow-sm">
          <CardContent className="pt-8">
            <div className="space-y-4 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <KeyRound className="h-8 w-8 animate-pulse text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Code Verified Successfully
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting you to create a new password...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Enter the code we sent to your email" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Verify Reset Code
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? (
              <>
                We&apos;ve sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
                Enter it below to verify.
              </>
            ) : (
              "Enter the 6-digit verification code sent to your email."
            )}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="token"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                Verification Code
              </Label>
              <Input
                id="token"
                type="text"
                placeholder="000000"
                className="text-center font-mono text-2xl tracking-widest"
                maxLength={6}
                value={token}
                onChange={(e) =>
                  setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="flex w-full items-center justify-center gap-2 p-5"
                disabled={isLoading || token.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
                <KeyRound className="size-4" />
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to Email Input
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
