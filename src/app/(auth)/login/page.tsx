"use client"

import * as React from "react"
import Link from "next/link"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { LogIn, Mail } from "lucide-react"
import {
  AuthHeader,
  PasswordInput,
  SocialAuthButtons,
} from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useSearchParams } from "next/navigation"
import type { LoginResponseData } from "@/types/auth"

type LoginResponse = {
  success: boolean
  message?: string
  data?: LoginResponseData
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState(
    searchParams.get("oauth_error") ?? ""
  )
  const { setToken, setUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const contentType = response.headers.get("content-type") || ""
      const text = await response.text()
      let data: LoginResponse | null = null

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(text)
        } catch (jsonError) {
          console.error("Login JSON parse failed", jsonError, text)
          throw new Error("Received invalid JSON from login endpoint")
        }
      }

      console.log("Login response:", {
        status: response.status,
        contentType,
        data,
        text: !data ? text.slice(0, 400) : undefined,
      })

      if (!response.ok) {
        const message = data?.message || text || "Login failed"
        setError(typeof message === "string" ? message : "Login failed")
        setIsLoading(false)
        return
      }

      if (!data) {
        setError("Login endpoint returned non-JSON response")
        setIsLoading(false)
        return
      }

      // Save JWT token and user to auth context
      const token = data.data?.token
      const user = data.data?.user

      if (token) {
        setToken(token)
      }
      if (user) {
        setUser(user)
      }

      // Success - client-side navigation based on role
      const role = user?.role
      console.log("Login successful, redirecting to", role)
      // Honor ?redirect= (same-origin paths only) so guests return to
      // where they came from — e.g. a product they tried to add to cart.
      const redirectTo = searchParams.get("redirect")
      if (
        redirectTo &&
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//")
      ) {
        router.push(redirectTo)
      } else if (role === "admin") {
        router.push("/admin")
      } else if (role === "staff") {
        router.push("/staff")
      } else if (role === "cashier") {
        router.push("/cashier")
      } else {
        router.push("/customer")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Welcome back! Sign in to continue" />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
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

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="flex w-full items-center justify-center gap-2 p-5"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
                <LogIn className="size-4" />
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link
                href="/terms"
                className="font-bold text-primary hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-bold text-primary hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs tracking-wider whitespace-nowrap text-muted-foreground uppercase">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-4">
            <SocialAuthButtons />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-primary hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
