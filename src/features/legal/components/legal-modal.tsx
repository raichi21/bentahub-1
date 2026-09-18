"use client"

import * as React from "react"
import { X } from "lucide-react"
import { PrivacyContent, TermsContent } from "./legal-content"

export type LegalModalKind = "terms" | "privacy"

interface LegalModalProps {
  kind: LegalModalKind
  open: boolean
  onClose: () => void
}

export function LegalModal({ kind, open, onClose }: LegalModalProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const title = kind === "terms" ? "Terms and Conditions" : "Privacy Policy"

  return (
    <div
      className="fixed inset-0 z-[200] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted px-4 py-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-0.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Last Updated: 18/09/2026
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-card-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {kind === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  )
}
