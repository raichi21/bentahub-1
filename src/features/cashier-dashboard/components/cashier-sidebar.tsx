"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, Store, ClipboardList, LogOut, Monitor, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    category: "Dashboard",
    links: [
      { href: "/cashier", label: "POS System", icon: Monitor },
    ],
  },
  {
    category: "Operations",
    links: [
      { href: "/cashier/stock-check", label: "Stock Check", icon: ClipboardList },
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
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/50 z-30 md:hidden" />}

      <aside className={cn(
        "w-[280px] bg-[#0c1221] text-white flex flex-col fixed inset-y-0 left-0 z-40 border-r border-slate-900",
        "transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="px-6 py-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-lg tracking-tight truncate">BentaHub</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Cashier Panel
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors md:hidden flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.category} className="space-y-2">
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-white font-semibold border-l-4 border-primary"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400")} />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer / Account */}
        <div className="p-4 mt-auto border-t border-slate-800/80">
          <nav className="space-y-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  )
}
