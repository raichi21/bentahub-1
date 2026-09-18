"use client"

import * as React from "react"
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { BackupCodesDialog } from "./backup-codes-dialog"
import type { MfaSetupData, MfaStatusData } from "@/types/auth"

type JsonResponse = {
  success: boolean
  message?: string
  data?: Record<string, unknown> & {
    qrCodeDataUrl?: string
    manualSecret?: string
    otpauthUrl?: string
    backupCodes?: string[]
    enabled?: boolean
    backupCodesRemaining?: number
  }
}

/**
 * MFA management panel for settings/profile pages:
 * enroll, view status, regenerate backup codes, and disable.
 */
export function MfaPanel() {
  const { token } = useAuth()
  const [status, setStatus] = React.useState<MfaStatusData | null>(null)
  const [loadingStatus, setLoadingStatus] = React.useState(true)

  const [setup, setSetup] = React.useState<MfaSetupData | null>(null)
  const [setupCode, setSetupCode] = React.useState("")
  const [pendingBackupCodes, setPendingBackupCodes] = React.useState<
    string[] | null
  >(null)

  const [verifyCode, setVerifyCode] = React.useState("")
  const [action, setAction] = React.useState<"none" | "disable" | "regenerate">(
    "none"
  )

  const [error, setError] = React.useState("")
  const [notice, setNotice] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

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
        setStatus({
          enabled: data.data.enabled,
          backupCodesRemaining: data.data.backupCodesRemaining ?? 0,
        })
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

  const beginSetup = async () => {
    if (!token) return
    setError("")
    setNotice("")
    setBusy(true)
    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null
      if (!response.ok || !data?.success || !data.data?.manualSecret) {
        setError(data?.message || "Unable to start MFA setup")
        return
      }
      setSetup({
        manualSecret: data.data.manualSecret,
        qrCodeDataUrl: data.data.qrCodeDataUrl ?? "",
        otpauthUrl: data.data.otpauthUrl ?? "",
      })
      setSetupCode("")
    } catch (err) {
      console.error("MFA setup error:", err)
      setError("Unable to start MFA setup")
    } finally {
      setBusy(false)
    }
  }

  const confirmSetup = async () => {
    if (!token || !setup) return
    setError("")
    setNotice("")
    setBusy(true)
    try {
      const response = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: setupCode }),
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null
      if (!response.ok || !data?.success) {
        setError(data?.message || "Unable to confirm MFA setup")
        return
      }
      setPendingBackupCodes(data.data?.backupCodes ?? [])
      setSetup(null)
      setSetupCode("")
      await refreshStatus()
    } catch (err) {
      console.error("MFA confirm error:", err)
      setError("Unable to confirm MFA setup")
    } finally {
      setBusy(false)
    }
  }

  const cancelSetup = () => {
    setSetup(null)
    setSetupCode("")
    setError("")
  }

  const finishBackupCodes = () => {
    setPendingBackupCodes(null)
    setNotice(
      "MFA is now enabled. Backup codes were shown once — store any new codes somewhere safe."
    )
  }

  const runAction = async (nextAction: "disable" | "regenerate") => {
    if (!token) return
    setError("")
    setNotice("")
    setBusy(true)
    try {
      const response = await fetch(`/api/auth/mfa/${nextAction}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verifyCode }),
      })
      const data = (await response
        .json()
        .catch(() => null)) as JsonResponse | null

      if (!response.ok || !data?.success) {
        setError(
          data?.message ||
            `Unable to ${nextAction === "disable" ? "disable" : "regenerate"} MFA`
        )
        return
      }

      if (nextAction === "disable") {
        setNotice("MFA has been disabled for your account.")
        setAction("none")
        setVerifyCode("")
        await refreshStatus()
      } else {
        setPendingBackupCodes(data.data?.backupCodes ?? [])
        setVerifyCode("")
        setAction("none")
        await refreshStatus()
      }
    } catch (err) {
      console.error(`MFA ${nextAction} error:`, err)
      setError(
        `Unable to ${nextAction === "disable" ? "disable" : "regenerate"} MFA`
      )
    } finally {
      setBusy(false)
    }
  }

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
              ? "Protected with an authenticator app"
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

      {!enabled && !setup && (
        <>
          <Button onClick={beginSetup} disabled={busy} className="gap-2">
            <ShieldCheck className="size-4" />
            Set up MFA
          </Button>
          <p className="text-xs text-muted-foreground">
            You&apos;ll need to enter a code from your authenticator app every
            time you sign in.
          </p>
        </>
      )}

      {setup && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-2 text-center">
            <div className="inline-flex rounded-xl border border-border bg-background p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={setup.qrCodeDataUrl}
                alt="Scan this QR code with your authenticator app"
                width={180}
                height={180}
                className="h-44 w-44"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Scan with Google Authenticator, Microsoft Authenticator, or any
              TOTP app
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

          <div className="space-y-2">
            <Label
              htmlFor="mfa-setup-code"
              className="text-xs tracking-wider text-muted-foreground uppercase"
            >
              6-digit code
            </Label>
            <div className="flex gap-2">
              <Input
                id="mfa-setup-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={setupCode}
                onChange={(e) =>
                  setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="font-mono tracking-widest"
              />
              <Button
                onClick={confirmSetup}
                disabled={busy || setupCode.length !== 6}
              >
                Verify
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the code currently shown in your authenticator app
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={cancelSetup}
            disabled={busy}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}

      {pendingBackupCodes && (
        <BackupCodesDialog
          codes={pendingBackupCodes}
          onConfirm={finishBackupCodes}
        />
      )}

      {enabled && !setup && !pendingBackupCodes && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Remaining backup codes
            </span>
            <span className="font-semibold">
              {status?.backupCodesRemaining ?? 0}/10
            </span>
          </div>

          {action !== "none" && (
            <div className="space-y-2">
              <Label
                htmlFor="mfa-action-code"
                className="text-xs tracking-wider text-muted-foreground uppercase"
              >
                Enter your current authenticator code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="mfa-action-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="font-mono tracking-widest"
                />
                <Button
                  onClick={() => runAction(action)}
                  disabled={busy || verifyCode.length !== 6}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAction("none")
                    setVerifyCode("")
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {action === "none" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setAction("regenerate")}
                disabled={busy}
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                Regenerate backup codes
              </Button>
              <Button
                variant="destructive"
                onClick={() => setAction("disable")}
                disabled={busy}
                className="gap-2"
              >
                <Trash2 className="size-4" />
                Disable MFA
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
