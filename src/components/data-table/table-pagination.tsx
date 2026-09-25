"use client"

interface TablePaginationProps {
  page: number
  pageSize: number
  totalCount: number
  /** Rows actually displayed on this page (covers the empty-page edge). */
  currentCount: number
  onPageChange: (page: number) => void
  /** Trailing unit word. Defaults to "results". */
  unit?: string
}

/**
 * Shared "Showing X to Y of Z" + Previous/Next footer used by every
 * server-paginated report table. Renders nothing when there is no data.
 */
export function TablePagination({
  page,
  pageSize,
  totalCount,
  currentCount,
  onPageChange,
  unit = "results",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
      <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
        Showing {currentCount > 0 ? start : 0} to {end} of {totalCount} {unit}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm font-medium text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
