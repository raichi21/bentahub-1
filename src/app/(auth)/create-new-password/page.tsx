import { Suspense } from "react"
import { CreateNewPasswordForm } from "@/features/user-mgmt/components/create-new-password-form"

export default function CreateNewPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-[440px] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CreateNewPasswordForm />
    </Suspense>
  )
}
