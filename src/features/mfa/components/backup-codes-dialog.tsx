"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackupCodesDialogProps {
  codes: string[]
  onConfirm: () => void
}

/** One-time display of freshly generated backup codes with copy support. */
export function BackupCodesDialog({
  codes,
  onConfirm,
}: BackupCodesDialogProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — ignore.
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Save your backup codes
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          These codes are shown only once. Store them somewhere safe — use one
          to sign in if you lose your authenticator.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <code
            key={code}
            className="rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-sm tracking-wider"
          >
            {code}
          </code>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy all"}
        </Button>
        <Button type="button" onClick={onConfirm} className="flex-1">
          I&apos;ve saved my codes
        </Button>
      </div>
    </div>
  )
}
