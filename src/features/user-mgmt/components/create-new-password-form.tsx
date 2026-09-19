"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, LogIn } from "lucide-react"
import { AuthHeader, PasswordInput } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PASSWORD_RULES, getPasswordErrors } from "@/lib/password-validation"

export function CreateNewPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const email = searchParams.get("email") || ""

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(() =>
    token
      ? ""
      : "Invalid or missing verification session. Please request a new password reset."
  )
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Missing reset session. Please request a new reset code.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (getPasswordErrors(password).length > 0) {
      setError("Password does not meet the requirements below")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to reset password")
        setIsLoading(false)
        return
      }

      // Cleanup pending reset email from session storage if present
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingResetEmail")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      console.error("Reset password error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
        <AuthHeader subtitle="You're all set" />

        <Card className="border-border shadow-sm">
          <CardContent className="pt-8">
            <div className="space-y-4 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Lock className="h-8 w-8 animate-bounce text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Password Reset Successful
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been reset. You can now sign in with your
                  new password.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Button
                asChild
                className="flex w-full items-center justify-center gap-2 p-5"
              >
                <Link href="/login">
                  Sign In Now
                  <LogIn className="size-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Choose a new password for your account" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Create New Password
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? (
              <>
                Create a new password for{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </>
            ) : (
              "Enter your new password below."
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
                htmlFor="password"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                New Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !token}
                required
              />
              <div className="space-y-1 pt-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password)
                  return (
                    <p
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-xs ${passed ? "text-green-600" : "text-muted-foreground"}`}
                    >
                      <span
                        className={
                          passed ? "text-green-600" : "text-muted-foreground/60"
                        }
                      >
                        {passed ? "✓" : "✗"}
                      </span>
                      {rule.label}
                    </p>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                Confirm Password
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !token}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="flex w-full items-center justify-center gap-2 p-5"
                disabled={isLoading || !token}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
                <Lock className="size-4" />
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
