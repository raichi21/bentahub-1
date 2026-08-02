"use client"

import { useState, useRef, useEffect } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface SalesFiltersProps {
  branches: BranchOption[]
  branchId: string
  onBranchChange: (branchId: string) => void
  onExportCSV?: () => void
  onExportPDF?: () => void
}

export function SalesFilters({ branches, branchId, onBranchChange, onExportCSV, onExportPDF }: SalesFiltersProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/20">
        <h4 className="font-bold text-lg text-foreground">Sales Filters</h4>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <select
            value={branchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div ref={exportRef} className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-lg border border-border text-xs font-bold transition-all w-full md:w-auto justify-center"
            >
              <Download className="h-[18px] w-[18px]" />
              Export Data
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => { onExportCSV?.(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  Export as CSV (Excel)
                </button>
                <button
                  onClick={() => { onExportPDF?.(); setExportOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors border-t border-border"
                >
                  <FileText className="h-4 w-4 text-red-600" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
