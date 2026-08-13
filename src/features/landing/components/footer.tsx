"use client"

import Link from "next/link"
import { Globe, MessageCircle, Share2 } from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"

export function Footer() {
  const { storeName } = useStoreSettings()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-zinc-900 text-zinc-100 py-12 mt-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <StoreLogo variant="bare" size="sm" iconClassName="text-primary" />
              <span className="font-heading text-xl font-bold text-white">{storeName}</span>
            </div>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs">
              Your neighborhood digital community store. Reserve essentials online and pick up at your convenience.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Share2 className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm text-white uppercase tracking-wider mb-4 font-bold">Shop</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">Browse Catalog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Branches</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Featured Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-white uppercase tracking-wider mb-4 font-bold">Support</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm text-white uppercase tracking-wider mb-4 font-bold">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">
            © {currentYear} {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
