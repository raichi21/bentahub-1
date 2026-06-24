"use client"

import { cn } from "@/lib/utils"

const categories = [
  { name: "All Products", count: 248 },
  { name: "Coffee", count: 12 },
  { name: "Condiments", count: 45 },
  { name: "Baking Ingredients", count: 28 },
  { name: "Canned Goods", count: 89 },
  { name: "Sauces", count: 35 },
  { name: "Household Supplies", count: 22 },
]

interface CategorySidebarProps {
  activeCategory: string
  onSelectCategory: (category: string) => void
}

export function CategorySidebar({ activeCategory, onSelectCategory }: CategorySidebarProps) {
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

