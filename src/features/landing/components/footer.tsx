"use client"

import Link from "next/link"
import { Globe, MessageCircle, Share2 } from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"

export function Footer() {
  const { storeName } = useStoreSettings()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 bg-zinc-900 py-12 text-zinc-100">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <StoreLogo
                variant="bare"
                size="sm"
                iconClassName="text-primary"
              />
              <span className="font-heading text-xl font-bold text-white">
                {storeName}
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm text-zinc-400">
              Your neighborhood digital community store. Reserve essentials
              online and pick up at your convenience.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                <Globe className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-zinc-400 transition-colors hover:text-white"
              >
                <Share2 className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:col-span-8">
            <div>
              <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
                Shop
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Browse Catalog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Branches
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Featured Products
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
                Support
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="transition-colors hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link
                    href="/privacy"
                    className="transition-colors hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="transition-colors hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-6 md:flex-row">
          <p className="text-xs text-zinc-500">
            © {currentYear} {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
