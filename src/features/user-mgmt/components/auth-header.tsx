"use client"

import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

interface AuthHeaderProps {
  subtitle?: string
  className?: string
}

export function AuthHeader({ subtitle, className }: AuthHeaderProps) {
  const { storeName } = useStoreSettings()

  return (
    <div className={cn("mb-6 flex flex-col items-center", className)}>
      <StoreLogo size="lg" boxClassName="shadow-sm mb-2" />
      <h1 className="text-2xl font-bold text-primary">{storeName}</h1>
      {subtitle && (
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}
