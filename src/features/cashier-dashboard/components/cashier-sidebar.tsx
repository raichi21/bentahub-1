"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ClipboardList, LogOut, Monitor, X } from "lucide-react"
import { StoreLogo } from "@/components/store-logo"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    category: "Dashboard",
    links: [{ href: "/cashier", label: "POS System", icon: Monitor }],
  },
  {
    category: "Operations",
    links: [
      {
        href: "/cashier/stock-check",
        label: "Stock Check",
        icon: ClipboardList,
      },
    ],
  },
]

interface CashierSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CashierSidebar({ isOpen, onClose }: CashierSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { storeName } = useStoreSettings()

  const handleNav = () => {
    onClose()
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // proceed
    }
    router.push("/login")
  }

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-slate-900 bg-[#0c1221] text-white",
          "transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-8">
          <StoreLogo boxClassName="shadow-lg shadow-primary/30" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-lg font-bold tracking-tight">
              {storeName}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Cashier Panel
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {group.category}
              </p>
              <nav className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleNav}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                        isActive
                          ? "border-l-4 border-primary bg-primary/20 font-semibold text-white"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary" : "text-slate-400"
                        )}
                      />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer / Account */}
        <div className="mt-auto border-t border-slate-800/80 p-4">
          <nav className="space-y-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  )
}
