"use client"

import * as React from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type PasswordInputProps = React.ComponentProps<typeof Input>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="relative">
      <Lock className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-12 pl-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <EyeOff className="size-5" />
        ) : (
          <Eye className="size-5" />
        )}
      </button>
    </div>
  )
}
