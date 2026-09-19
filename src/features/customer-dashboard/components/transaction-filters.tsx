"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionFiltersProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  dateFrom: string
  onDateFromChange: (date: string) => void
  searchPlaceholder?: string
}

export function TransactionFilters({
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  searchPlaceholder = "Search transactions...",
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      {/* Tabs */}
      <div className="flex gap-6 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "relative pb-3 text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Date */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border bg-background pr-4 pl-9 text-sm transition-colors outline-none focus:border-primary md:w-64"
          />
        </div>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm transition-colors outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}
