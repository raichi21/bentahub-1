"use client"

import { useState } from "react"
import { Tags, Ruler, Package } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ManageCategories } from "./manage-categories"
import { ManageUnits } from "./manage-units"
import { ManageProducts } from "./manage-products"
import { cn } from "@/lib/utils"

type Tab = "categories" | "units" | "products"

export function ProductManagement() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>("categories")

  const canManageCategories =
    user?.role === "admin" || !!user?.canManageCategories
  const canManageUnits = user?.role === "admin" || !!user?.canManageUnits
  const canManageProducts = user?.role === "admin" || !!user?.canManageProducts

  const tabs: {
    id: Tab
    label: string
    icon: React.ElementType
    visible: boolean
  }[] = [
    { id: "categories", label: "Categories", icon: Tags, visible: true },
    { id: "units", label: "Units", icon: Ruler, visible: true },
    { id: "products", label: "Product List", icon: Package, visible: true },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-px">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "categories" && (
        <ManageCategories canManage={canManageCategories} />
      )}
      {tab === "units" && <ManageUnits canManage={canManageUnits} />}
      {tab === "products" && <ManageProducts canManage={canManageProducts} />}
    </div>
  )
}
