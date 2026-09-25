"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

interface ExportMenuProps {
  onExportCSV?: () => void
  onExportPDF?: () => void
}

/**
 * Shared Export dropdown used by every report table (payments, sales,
 * history, cash drawer, pickups, inventory...). Single source of truth
 * for the button, the CSV/PDF menu items, and the outside-click close.
 */
export function ExportMenu({ onExportCSV, onExportPDF }: ExportMenuProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={exportRef} className="relative">
      <button
        onClick={() => setExportOpen(!exportOpen)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-bold transition-all hover:bg-muted md:w-auto"
      >
        <Download className="h-[18px] w-[18px]" />
        Export
      </button>
      {exportOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <button
            onClick={() => {
              onExportCSV?.()
              setExportOpen(false)
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Export as CSV (Excel)
          </button>
          <button
            onClick={() => {
              onExportPDF?.()
              setExportOpen(false)
            }}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FileText className="h-4 w-4 text-red-600" />
            Export as PDF
          </button>
        </div>
      )}
    </div>
  )
}
