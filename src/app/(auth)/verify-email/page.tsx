import * as React from "react"
import { VerifyEmailForm } from "@/features/user-mgmt"

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex w-full max-w-[440px] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailForm />
    </React.Suspense>
  )
}
