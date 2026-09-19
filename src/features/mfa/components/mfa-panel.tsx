"use client"

import * as React from "react"
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  X,
  Mail,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import type { MfaStatusData } from "@/types/auth"

type JsonResponse = {
  success: boolean
  message?: string
  data?: { email?: string; enabled?: boolean; disabled?: boolean }
}

/**
 * MFA management panel for settings/profile pages: enable (via a code emailed
 * to the account) and disable (via a fresh emailed code).
 */
export function MfaPanel() {
  const { token } = useAuth()
  const [status, setStatus] = React.useState<MfaStatusData | null>(null)
  const [loadingStatus, setLoadingStatus] = React.useState(true)

  const [pendingAction, setPendingAction] = React.useState<
    "enable" | "disable" | null
  >(null)
  const [code, setCode] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [error, setError] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const refreshStatus = React.useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch("/api/auth/mfa/status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null
      if (
        response.ok &&
        data?.success &&
        typeof data.data?.enabled === "boolean"
      ) {
        setStatus({ enabled: data.data.enabled })
      } else {
        setError(data?.message || "Unable to load MFA status")
      }
    } catch (err) {
      console.error("MFA status load error:", err)
      setError("Unable to load MFA status")
    }
  }, [token])

  React.useEffect(() => {
    if (!token) return
    let cancelled = false
    void (async () => {
      try {
        await refreshStatus()
      } finally {
        if (!cancelled) setLoadingStatus(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, refreshStatus])

  const requestCode = async (action: "enable" | "disable") => {
    if (!token) return
    setError("")
    setNotice("")
    setCode("")
    setEmail("")
    setPendingAction(action)
    setBusy(true)
    try {
      const url =
        action === "enable" ? "/api/auth/mfa/setup" : "/api/auth/mfa/disable"
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null
      if (!response.ok || !data?.success) {
        setError(data?.message || "Unable to send the verification code")
        setPendingAction(null)
        return
      }
      if (data.data?.email) setEmail(data.data.email)
    } catch (err) {
      console.error("MFA code request error:", err)
      setError("Unable to send the verification code")
      setPendingAction(null)
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = async (action: "enable" | "disable") => {
    if (!token) return
    setError("")
    setNotice("")
    setBusy(true)
    try {
      const url =
        action === "enable" ? "/api/auth/mfa/verify" : "/api/auth/mfa/disable"
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null

      if (!response.ok || !data?.success) {
        setError(data?.message || "Verification failed")
        return
      }

      setNotice(
        action === "enable"
          ? "MFA is now enabled. A verification code will be emailed to you at every sign-in."
          : "MFA has been disabled for your account."
      )
      setPendingAction(null)
      setCode("")
      setEmail("")
      await refreshStatus()
    } catch (err) {
      console.error(`MFA ${action} error:`, err)
      setError("Verification failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const cancelAction = () => {
    setPendingAction(null)
    setCode("")
    setEmail("")
    setError("")
  }

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const enabled = Boolean(status?.enabled)

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="size-5 text-primary" />
            Two-Factor Authentication
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? "Protected with a verification code sent to your email"
              : "Add an extra layer of security to your account"}
          </p>
        </div>
        {!loadingStatus && (
          <span
            className={
              enabled
                ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {enabled ? "Enabled" : "Disabled"}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <ShieldAlert className="size-4" />
            {error}
          </p>
        </div>
      )}

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            {notice}
          </p>
        </div>
      )}

      {!enabled && pendingAction === null && (
        <>
          <Button
            onClick={() => requestCode("enable")}
            disabled={busy}
            className="gap-2"
          >
            <ShieldCheck className="size-4" />
            Enable MFA
          </Button>
          <p className="text-xs text-muted-foreground">
            A 6-digit code will be sent to your email at every sign-in.
          </p>
        </>
      )}

      {enabled && pendingAction === null && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            variant="destructive"
            onClick={() => requestCode("disable")}
            disabled={busy}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            Disable MFA
          </Button>
        </div>
      )}

      {pendingAction !== null && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              {email
                ? `A verification code was sent to ${email}.`
                : "A verification code was sent to your email."}{" "}
              {pendingAction === "enable"
                ? "Enter it to enable MFA."
                : "Enter it to disable MFA."}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="mfa-code"
              className="text-xs tracking-wider text-muted-foreground uppercase"
            >
              Verification code
            </Label>
            <div className="flex gap-2">
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="font-mono tracking-widest"
              />
              <Button
                onClick={() => confirmAction(pendingAction)}
                disabled={busy || code.length !== 6}
              >
                {pendingAction === "enable" ? "Enable" : "Confirm"}
              </Button>
              <Button
                variant="ghost"
                onClick={cancelAction}
                disabled={busy}
                className="gap-1.5"
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <KeyRound className="size-3.5" />
              Code is valid for 5 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
