"use client"

import { cn } from "@/lib/utils"
import type { CategoryChip } from "@/features/customer-dashboard/components/category-chips"

interface CategorySidebarProps {
  activeCategory: string
  onSelectCategory: (category: string) => void
  /** Pre-computed category list (shared with the mobile chips row). */
  categories: CategoryChip[]
}

export function CategorySidebar({
  activeCategory,
  onSelectCategory,
  categories,
}: CategorySidebarProps) {
  return (
    <div className="hidden min-h-[calc(100vh-8rem)] w-56 shrink-0 flex-col gap-6 border-r border-border py-4 pr-4 md:flex">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Categories
        </h3>
        <div className="flex flex-col gap-1">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => onSelectCategory(category.name)}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                activeCategory === category.name
                  ? "bg-accent font-bold text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{category.name}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  activeCategory === category.name
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
