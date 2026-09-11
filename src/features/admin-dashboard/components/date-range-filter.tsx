"use client"

import { Calendar, X } from "lucide-react"

interface DateRangeFilterProps {
  /** Selected date (YYYY-MM-DD). Empty string means no filter (All Time). */
  value: string
  /** Called when the user picks a date via the calendar. */
  onChange: (value: string) => void
}

/**
 * Shared single-date calendar filter for admin reports (sales, monitoring).
 * The caller uses the selected date as both dateFrom and dateTo so only that
 * specific day's data is shown. Stays compact and consistent next to the
 * Select Branches filter.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const display = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select date range"

  return (
    <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:border-primary outline-none w-full md:w-auto">
      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>{display}</span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onChange("")
          }}
          className="relative z-10 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto"
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Select date range"
      />
    </div>
  )
}
