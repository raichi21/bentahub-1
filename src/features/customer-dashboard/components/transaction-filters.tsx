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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Tabs */}
      <div className="flex border-b border-border gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative whitespace-nowrap",
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full md:w-64 pl-9 pr-4 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
          />
        </div>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-9 px-3 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  )
}
