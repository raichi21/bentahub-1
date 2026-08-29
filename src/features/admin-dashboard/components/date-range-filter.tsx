"use client"

import { Calendar } from "lucide-react"

interface DateRangeFilterProps {
  /** Start date as YYYY-MM-DD string, or null/empty when unset. */
  dateFrom: string
  /** End date as YYYY-MM-DD string, or null/empty when unset. */
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onClear: () => void
}

/**
 * Shared From/To date range filter for admin reports (sales, monitoring).
 * Native date inputs keep it dependency-free. Empty values mean "no filter".
 */
export function DateRangeFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
}: DateRangeFilterProps) {
  const hasFilter = Boolean(dateFrom || dateTo)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="h-4 w-4" />
      </div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        From
      </label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="border border-border rounded-lg bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        To
      </label>
      <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => onDateToChange(e.target.value)}
        className="border border-border rounded-lg bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hasFilter && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Clear
        </button>
      )}
    </div>
  )
}
