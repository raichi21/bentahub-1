"use client"

import { cn } from "@/lib/utils"

export interface CategoryChip {
  name: string
  count: number
}

interface CategoryChipsProps {
  categories: CategoryChip[]
  activeCategory: string
  onSelectCategory: (category: string) => void
}

export function CategoryChips({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  return (
    <nav
      aria-label="Categories"
      className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {categories.map((category) => (
        <button
          key={category.name}
          onClick={() => onSelectCategory(category.name)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === category.name
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted"
          )}
        >
          {category.name}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[11px] leading-none font-semibold",
              activeCategory === category.name
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {category.count}
          </span>
        </button>
      ))}
    </nav>
  )
}
