"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"

export function Navbar() {
  const { storeName } = useStoreSettings()

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <StoreLogo variant="bare" size="sm" iconClassName="text-primary" />
            <span className="font-bold text-xl tracking-tight">{storeName}</span>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-foreground font-semibold border-b-2 border-primary px-1 pt-1"
            >
              Home
            </Link>
            <Link 
              href="/customer" 
              className="text-muted-foreground hover:text-foreground transition-colors px-1 pt-1"
            >
              Browse Products
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
