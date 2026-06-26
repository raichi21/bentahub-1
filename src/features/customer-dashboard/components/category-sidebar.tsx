"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Product } from "@/stores/productsStore"

interface CategorySidebarProps {
  activeCategory: string
  onSelectCategory: (category: string) => void
  products?: Product[]
}

export function CategorySidebar({ activeCategory, onSelectCategory, products }: CategorySidebarProps) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    let allCount = 0
    if (products && products.length > 0) {
      for (const p of products) {
        if (p.isActive === false) continue
        allCount++
        counts.set(p.category, (counts.get(p.category) || 0) + 1)
      }
    }
    const list = Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    return [{ name: "All Products", count: allCount }, ...list]
  }, [products])

  return (
    <div className="w-56 shrink-0 hidden md:flex flex-col gap-6 p-4 border-r border-border min-h-[calc(100vh-8rem)]">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold tracking-widest text-muted-foreground mb-3 uppercase">
          Categories
        </h3>
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => onSelectCategory(category.name)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                activeCategory === category.name
                  ? "bg-accent text-primary font-bold"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{category.name}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeCategory === category.name ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

