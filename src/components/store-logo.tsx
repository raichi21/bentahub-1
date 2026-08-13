"use client"

import Image from "next/image"
import { Store } from "lucide-react"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

type StoreLogoSize = "sm" | "md" | "lg"
type StoreLogoVariant = "boxed" | "bare"

interface StoreLogoProps {
  /** Renders the logo inside a colored box. "bare" renders just the image/icon (no background box). */
  variant?: StoreLogoVariant
  /** Proportional scale preset — box size, padding, icon, and image hints scale together. */
  size?: StoreLogoSize
  /** Extra classes for the container (colors, shadows, rounding, spacing). */
  boxClassName?: string
  /** Extra classes for the fallback icon when no logo is set. */
  iconClassName?: string
}

const SIZE_MAP: Record<StoreLogoSize, { box: string; padding: string; icon: string; sizes: string }> = {
  sm: { box: "h-7 w-7", padding: "p-0", icon: "h-5 w-5", sizes: "28px" },
  md: { box: "h-10 w-10", padding: "p-1", icon: "h-6 w-6", sizes: "40px" },
  lg: { box: "h-12 w-12", padding: "p-1.5", icon: "h-7 w-7", sizes: "48px" },
}

/**
 * Brand logo. Shows the configured store logo image when set,
 * otherwise renders the Store icon fallback. Sizing is proportional:
 * box, image padding, icon, and image hints all scale from one `size`.
 */
export function StoreLogo({
  variant = "boxed",
  size = "md",
  boxClassName,
  iconClassName,
}: StoreLogoProps) {
  const { logo } = useStoreSettings()
  const preset = SIZE_MAP[size]

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center flex-shrink-0",
        variant === "boxed" && "rounded-lg bg-primary",
        preset.box,
        variant === "boxed" && preset.padding,
        boxClassName
      )}
    >
      {logo ? (
        <Image
          src={logo}
          alt="Store logo"
          fill
          sizes={preset.sizes}
          className="object-contain"
          unoptimized
        />
      ) : (
        <Store className={cn(preset.icon, "text-white", iconClassName)} />
      )}
    </div>
  )
}
