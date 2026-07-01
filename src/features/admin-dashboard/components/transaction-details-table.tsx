"use client"

import { FileX, Loader2 } from "lucide-react"
import type { SalesTransactionRowData } from "@/types/admin"

interface TransactionDetailsTableProps {
  transactions: SalesTransactionRowData[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  loading: boolean
}

export function TransactionDetailsTable({
  transactions,
  totalCount,
  page,
  pageSize,
  onPageChange,
  loading,
}: TransactionDetailsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-3 bg-muted/20 border-b border-border flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground">Transaction Details</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td className="px-6 py-20 text-center" colSpan={6}>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-20 text-center" colSpan={6}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <FileX className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No records found for the selected filters.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your date range or branch selection.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-foreground">{t.displayId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{t.branchName}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("en-PH", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold text-foreground">
                    ₱{parseFloat(t.totalAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      t.paymentMethod === "gcash"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    }`}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-background border-t border-border flex justify-between items-center">
        <p className="text-xs text-muted-foreground font-medium">
          Showing {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-border rounded text-muted-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
