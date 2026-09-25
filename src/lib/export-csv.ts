/**
 * CSV download helper shared by every report table in the app.
 *
 * Callers build plain header/row arrays (sanitizing their own values, e.g.
 * stripping commas from free-text notes) and this module handles the
 * join + Blob + anchor-download + cleanup dance in one place.
 */

export type CsvCell = string | number | Date | null | undefined

function toCell(value: CsvCell): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

/** Build the raw CSV text (headers + rows, comma-joined, newline-split). */
export function toCsvContent(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((line) => line.map(toCell).join(",")).join("\n")
}

/** Trigger a browser download of the given headers/rows as a .csv file. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][]
): void {
  const blob = new Blob([toCsvContent(headers, rows)], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
