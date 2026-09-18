import * as React from "react"
import { MfaSetupForm } from "@/features/mfa"

export default function MfaSetupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex w-full max-w-[440px] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MfaSetupForm />
    </React.Suspense>
  )
}
