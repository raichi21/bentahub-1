"use client"

export interface BranchSelectOption {
  id: string
  name: string
}

interface BranchSelectProps {
  options: BranchSelectOption[]
  value: string
  onChange: (value: string) => void
  /** Value for the "all" option. Defaults to "" (use "all" where legacy code did). */
  allValue?: string
  /** Label for the "all" option. Defaults to "All Branches". */
  allLabel?: string
  className?: string
}

const DEFAULT_SELECT_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary md:w-auto"

/**
 * Shared branch/cashier dropdown used by report tables. Visuals stay
 * identical via className passthrough; only the option plumbing is shared.
 */
export function BranchSelect({
  options,
  value,
  onChange,
  allValue = "",
  allLabel = "All Branches",
  className = DEFAULT_SELECT_CLASS,
}: BranchSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value={allValue}>{allLabel}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}
