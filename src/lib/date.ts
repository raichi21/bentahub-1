export const PH_TIME_ZONE = "Asia/Manila"

const PH_UTC_OFFSET_MS = 8 * 60 * 60 * 1000

interface PHParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getPHParts(date: Date): PHParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PH_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  }
}

/** Build the Date instant whose Manila wall-clock equals the given parts. */
function fromManilaParts(parts: Omit<PHParts, "second"> & { second?: number }): Date {
  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second ?? 0) -
      PH_UTC_OFFSET_MS
  )
}

/** The current instant (same as `new Date()`, but derived from the Manila clock). */
export function getManilaNow(date: Date = new Date()): Date {
  return fromManilaParts(getPHParts(date))
}

/** Midnight (00:00:00.000) of the Manila calendar day that contains `date`. */
export function startOfManilaDay(date: Date = new Date()): Date {
  return fromManilaParts({ ...getPHParts(date), hour: 0, minute: 0, second: 0 })
}

/** End of day (23:59:59.999) of the Manila calendar day that contains `date`. */
export function endOfManilaDay(date: Date = new Date()): Date {
  return new Date(startOfManilaDay(date).getTime() + 24 * 60 * 60 * 1000 - 1)
}

/** Next pickup deadline: 5:00 PM Manila today, or tomorrow if already past. */
export function nextPickupDeadline(date: Date = new Date()): Date {
  const p = getPHParts(date)
  const today = fromManilaParts({ ...p, hour: 17, minute: 0, second: 0 })
  if (date >= today) {
    return new Date(today.getTime() + 24 * 60 * 60 * 1000)
  }
  return today
}

/** Format a date as a Manila-timezone date string. */
export function formatPHDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-PH", { ...options, timeZone: PH_TIME_ZONE })
}

/** Format a date as a Manila-timezone date+time string. */
export function formatPHDateTime(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-PH", { ...options, timeZone: PH_TIME_ZONE })
}
