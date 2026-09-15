"use client"

import { useRef } from "react"
import { Calendar, X } from "lucide-react"

interface DateRangeFilterProps {
  /** Selected date (YYYY-MM-DD). Empty string means no filter (All Time). */
  value: string
  /** Called when the user picks a date via the calendar. */
  onChange: (value: string) => void
  /** Optional short prefix shown next to the calendar icon (e.g. "From" / "To"). */
  label?: string
  /** Placeholder shown when no date is selected. Defaults to "Select date range". */
  placeholder?: string
  /** Earliest selectable date (YYYY-MM-DD). */
  min?: string
  /** Latest selectable date (YYYY-MM-DD). */
  max?: string
}

/**
 * Shared calendar filter for admin reports. The caller uses the selected date
 * as both dateFrom and dateTo so only that specific day's data is shown.
 * Stays compact and consistent next to the Select Branches filter.
 */
export function DateRangeFilter({
  value,
  onChange,
  label,
  placeholder = "Select date range",
  min,
  max,
}: DateRangeFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const display = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : placeholder

  const openPicker = () => {
    const el = inputRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
    }
  }

  return (
    <div
      onClick={openPicker}
      className="relative flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary md:w-auto"
    >
      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      {label && (
        <span className="shrink-0 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
      )}
      <span
        className={
          value ? "font-medium text-foreground" : "text-muted-foreground"
        }
      >
        {display}
      </span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onChange("")
          }}
          className="relative z-10 ml-auto shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={placeholder}
      />
    </div>
  )
}
