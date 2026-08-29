"use client"

import { Calendar } from "lucide-react"

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
  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
      />
    </div>
  )
}
