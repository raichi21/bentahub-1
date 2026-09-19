"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"
import { AuthHeader } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to send reset email")
        setIsLoading(false)
        return
      }

      sessionStorage.setItem("pendingResetEmail", email)
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      console.error("Forgot password error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="We'll help you recover your account" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <CardTitle className="text-xl font-semibold">
              Reset Password
            </CardTitle>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
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
                htmlFor="email"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="flex w-full items-center justify-center gap-2 p-5"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Verification Code"}
                <Mail className="size-4" />
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground/80">
            Staff &amp; Cashier accounts: contact your administrator for
            password resets.
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
