import { Suspense } from "react"
import { ResetPasswordForm } from "@/features/user-mgmt/components/reset-password-form"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-[440px] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
