"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Download, FileSpreadsheet, FileText } from "lucide-react"

interface BranchOption {
  id: string
  name: string
}

interface SalesFiltersProps {
  branches: BranchOption[]
  onFilter: (branchId: string, dateFrom: string, dateTo: string) => void
  branchId: string
  dateFrom: string
  dateTo: string
  onExportCSV?: () => void
  onExportPDF?: () => void
}

export function SalesFilters({ branches, onFilter, branchId, dateFrom, dateTo, onExportCSV, onExportPDF }: SalesFiltersProps) {
  const [localBranch, setLocalBranch] = useState(branchId)
  const [localFrom, setLocalFrom] = useState(dateFrom)
  const [localTo, setLocalTo] = useState(dateTo)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleApply = () => {
    onFilter(localBranch, localFrom, localTo)
  }

  return (
    <section className="col-span-1 md:col-span-12 bg-card rounded-xl border border-border shadow-sm">
      <div className="px-6 py-3 bg-muted/20 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">Sales Filters</h3>
      </div>
      <div className="p-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date From</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Date To</label>
          <input
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold mb-2 text-muted-foreground">Branch</label>
          <select
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            value={localBranch}
            onChange={(e) => setLocalBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          aria-label="Apply filters"
        >
          <Search className="h-4 w-4" />
          Apply
        </button>
        <div ref={exportRef} className="relative ml-auto">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-2 px-6 py-2.5 bg-muted/50 hover:bg-muted rounded-lg border border-border text-sm font-bold transition-all w-full md:w-auto justify-center"
          >
            <Download className="h-[18px] w-[18px]" />
            Export
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
    </section>
  )
}
