"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { storeName } = useStoreSettings()
  const pathname = usePathname()

  const isHome = pathname === "/"
  const isCatalog = pathname === "/catalog" || pathname.startsWith("/catalog")

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <StoreLogo variant="bare" size="sm" iconClassName="text-primary" />
            <span className="text-xl font-bold tracking-tight">
              {storeName}
            </span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className={cn(
                "px-1 pt-1 transition-colors",
                isHome
                  ? "border-b-2 border-primary font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Home
            </Link>
            <Link
              href="/catalog"
              className={cn(
                "px-1 pt-1 transition-colors",
                isCatalog
                  ? "border-b-2 border-primary font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Browse Products
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
