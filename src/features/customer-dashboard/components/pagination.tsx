"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1)
  }

  const pages: Array<number | "left-ellipsis" | "right-ellipsis"> = [1]
  const leftSibling = Math.max(2, currentPage - 1)
  const rightSibling = Math.min(totalPages - 1, currentPage + 1)

  if (leftSibling > 2) {
    pages.push("left-ellipsis")
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    pages.push(page)
  }

  if (rightSibling < totalPages - 1) {
    pages.push("right-ellipsis")
  }

  pages.push(totalPages)
  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pageItems = getPageItems(currentPage, totalPages)

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="sr-only">Previous Page</span>
      </button>

      {pageItems.map((item) => {
        if (item === "left-ellipsis" || item === "right-ellipsis") {
          return (
            <span key={item} className="text-muted-foreground">
              ...
            </span>
          )
        }

        return (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === item
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted text-foreground"
            }`}
          >
            {item}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border disabled:opacity-40 disabled:pointer-events-none"
      >
        <ChevronRight className="h-5 w-5" />
        <span className="sr-only">Next Page</span>
      </button>
    </div>
  )
}
