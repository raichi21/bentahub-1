"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

/**
 * Continue with Google / Facebook buttons.
 *
 * Each button performs a full-page redirect to the OAuth initiate route; the
 * provider consent flow runs server-side and lands back on /oauth-result. If
 * the provider is not configured, the route redirects to /login?oauth_error=.
 */
export function SocialAuthButtons() {
  const [isBusy, setIsBusy] = React.useState<"google" | "facebook" | null>(null)

  const handleProvider = (provider: "google" | "facebook") => {
    setIsBusy(provider)
    window.location.href = `/api/auth/oauth/${provider}`
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2.5 p-5 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
        disabled={isBusy !== null}
        onClick={() => handleProvider("google")}
      >
        {isBusy === "google" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        ) : (
          <GoogleGlyph />
        )}
        Continue with Google
      </Button>

      <Button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 p-5 bg-[#1877F2] hover:bg-[#166fe5] text-white"
        disabled={isBusy !== null}
        onClick={() => handleProvider("facebook")}
      >
        {isBusy === "facebook" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <FacebookGlyph />
        )}
        Continue with Facebook
      </Button>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.7-3.79H1.3v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.36 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12.04 12.04 0 0 0 0 10.8l4.06-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.76 0 3.35.6 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 1.3 6.6l4.06 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true" focusable="false" role="img">
      <path
        fill="currentColor"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.02 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.55-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.81V24C19.61 23.09 24 18.09 24 12.07Z"
      />
    </svg>
  )
}