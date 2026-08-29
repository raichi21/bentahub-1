"use client"

import { Calendar } from "lucide-react"

interface DateRangeFilterProps {
  /** Selected preset key ("" = All Time). */
  value: string
  /**
   * Called when a preset is chosen. Passes the chosen preset along with the
   * resolved from/to dates (YYYY-MM-DD) so the caller can pass them to the API.
   */
  onChange: (value: string, from: string, to: string) => void
}

const PRESETS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
]

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Resolves a preset key into inclusive from/to date strings (YYYY-MM-DD). */
function resolvePreset(preset: string): { from: string; to: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case "today":
      return { from: toISODate(today), to: toISODate(today) }
    case "7d": {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { from: toISODate(from), to: toISODate(today) }
    }
    case "thisWeek": {
      const dayOfWeek = (today.getDay() + 6) % 7 // Monday = 0
      const from = new Date(today)
      from.setDate(from.getDate() - dayOfWeek)
      return { from: toISODate(from), to: toISODate(today) }
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: toISODate(from), to: toISODate(today) }
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: toISODate(from), to: toISODate(to) }
    }
    default:
      return { from: "", to: "" }
  }
}

/**
 * Shared single-control date range preset for admin reports (sales, monitoring).
 * Uses a dropdown instead of two date inputs so the filter stays compact and
 * consistent next to the Select Branches filter.
 */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => {
          const preset = e.target.value
          const { from, to } = resolvePreset(preset)
          onChange(preset, from, to)
        }}
        className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  )
}
