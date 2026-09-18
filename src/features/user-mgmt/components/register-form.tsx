"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserPlus, Mail, User } from "lucide-react"
import { AuthHeader, PasswordInput } from "@/features/user-mgmt"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/features/user-mgmt/actions/register"
import { PASSWORD_RULES, getPasswordErrors } from "@/lib/password-validation"
import {
  LegalModal,
  type LegalModalKind,
} from "@/features/legal/components/legal-modal"
import type { RegisterPayload } from "@/types/auth"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  })
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [legalModal, setLegalModal] = React.useState<LegalModalKind | null>(
    null
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    // Client-side validations
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (getPasswordErrors(formData.password).length > 0) {
      setError("Password does not meet the requirements below")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser(formData as RegisterPayload)

      if (!result.success) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      setSuccess(result.message)

      // Store in session storage for the verify email page
      sessionStorage.setItem("pendingVerificationEmail", formData.email)

      // Redirect to email verification page after 1.5 seconds
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      }, 1500)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[440px] animate-in duration-700 fade-in slide-in-from-bottom-4">
      <AuthHeader subtitle="Create your BentaHub Account" />

      <Card className="border-border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-in rounded-lg border border-destructive/30 bg-destructive/10 p-3 duration-200 fade-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="animate-in rounded-lg border border-emerald-200 bg-emerald-50 p-3 duration-200 fade-in dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {success}
                </p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fullName"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
              <div className="space-y-1 pt-1">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(formData.password)
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Confirm Password
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                required
              />
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked)
                  setError("")
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                disabled={isLoading}
                required
              />
              <label
                htmlFor="acceptTerms"
                className="text-sm text-muted-foreground"
              >
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setLegalModal("terms")}
                  className="font-bold text-primary hover:underline"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setLegalModal("privacy")}
                  className="font-bold text-primary hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="flex w-full items-center justify-center gap-2 p-5"
                disabled={isLoading || !acceptTerms}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Register
                    <UserPlus className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>

      <LegalModal
        kind={legalModal ?? "terms"}
        open={legalModal !== null}
        onClose={() => setLegalModal(null)}
      />
    </div>
  )
}
