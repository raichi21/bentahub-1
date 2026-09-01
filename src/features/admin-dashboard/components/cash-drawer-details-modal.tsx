"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { X, ChevronDown, ChevronRight, Loader2, FileX } from "lucide-react"
import type { CashDrawerRow } from "./cash-drawer-table"
import { useAuth } from "@/hooks/useAuth"

interface CashDrawerTransactionDetail {
  id: string
  displayId: string
  createdAt: Date
  createdAtDisplay: string
  totalAmount: number
  totalAmountDisplay: string
  paymentMethod: string
  paymentMethodDisplay: string
  amountPaid: number | null
  amountPaidDisplay: string
  change: number | null
  changeDisplay: string
  status: string
  statusDisplay: string
  items: {
    productName: string
    quantity: number
    price: number
    subtotal: number
  }[]
}

interface CashDrawerTransactionsData {
  summary: {
    transactionCount: number
    cashCount: number
    gcashCount: number
    cashTotal: number
    cashTotalDisplay: string
    gcashTotal: number
    gcashTotalDisplay: string
  }
  transactions: CashDrawerTransactionDetail[]
}

interface CashDrawerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  session: CashDrawerRow | null
}

function formatTime(display: string | null | undefined): string {
  return display ?? "—"
}

export function CashDrawerDetailsModal({ isOpen, onClose, session }: CashDrawerDetailsModalProps) {
  const { token } = useAuth()
  const [data, setData] = useState<CashDrawerTransactionsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchTransactions = useCallback(async () => {
    if (!isOpen || !session || !token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cash-drawer/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(json.message || "Failed to load transactions")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [isOpen, session, token])

  useEffect(() => {
    if (isOpen && session) {
      const timer = setTimeout(() => fetchTransactions(), 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, session, fetchTransactions])

  if (!isOpen || !session) return null

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const summary = data?.summary

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
      <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Cash Drawer Session - {session.displayId}</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs border ${
              session.status === "open"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            }`}>
              {session.statusDisplay}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border border-border">
            <div className="space-y-1.5 text-sm">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Session Info</h4>
              <p className="text-muted-foreground">Branch: <span className="font-semibold text-foreground">{session.branchName}</span></p>
              <p className="text-muted-foreground">Cashier: <span className="font-semibold text-foreground">{session.cashierName}</span></p>
              <p className="text-muted-foreground">Opened: <span className="font-semibold text-foreground">{formatTime(session.openedAtDisplay)}</span></p>
              <p className="text-muted-foreground">Closed: <span className="font-semibold text-foreground">{formatTime(session.closedAtDisplay)}</span></p>
            </div>
            <div className="space-y-1.5 text-sm">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Cash Reconciliation</h4>
              <p className="text-muted-foreground">Starting: <span className="font-semibold text-foreground">{session.startingCashDisplay}</span></p>
              <p className="text-muted-foreground">Expected Ending: <span className="font-semibold text-foreground">{session.expectedEndingCashDisplay}</span></p>
              <p className="text-muted-foreground">Actual Ending: <span className="font-semibold text-foreground">{session.actualEndingCashDisplay}</span></p>
              <p className="text-muted-foreground">Net Impact: <span className="font-semibold text-foreground">{session.netCashImpactDisplay}</span></p>
              <p className="text-muted-foreground">Difference: <span className="font-semibold text-foreground">{session.diffDisplay}</span></p>
            </div>
          </div>

          {session.notes && (
            <div className="p-4 bg-muted/10 rounded-lg border border-border">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Transactions{summary ? ` (${summary.transactionCount})` : ""}
              </h4>
              {summary && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{summary.cashCount} cash • {summary.cashTotalDisplay}</span>
                  <span className="text-border">|</span>
                  <span>{summary.gcashCount} gcash • {summary.gcashTotalDisplay}</span>
                </div>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading transactions...
              </div>
            )}

            {!loading && error && (
              <div className="p-6 text-center text-sm text-red-500">Error: {error}</div>
            )}

            {!loading && !error && data && data.transactions.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileX className="h-7 w-7" />
                </div>
                <p className="font-semibold text-foreground">No transactions in this session.</p>
                <p className="text-sm text-muted-foreground">Cash and GCash transactions will appear here.</p>
              </div>
            )}

            {!loading && !error && data && data.transactions.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-muted/10 border-b border-border">
                    <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-4 py-3 w-8"></th>
                      <th className="px-4 py-3">Transaction</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3 text-right">Amount Paid</th>
                      <th className="px-4 py-3 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-foreground">
                    {data.transactions.map((txn) => {
                      const isOpenRow = expanded.has(txn.id)
                      return (
                        <Fragment key={txn.id}>
                          <tr
                            onClick={() => toggleExpand(txn.id)}
                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              {isOpenRow
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono font-medium text-foreground">{txn.displayId}</span>
                              <span className="block text-xs text-muted-foreground">{txn.createdAtDisplay}</span>
                            </td>
                            <td className="px-4 py-3 font-medium">{txn.totalAmountDisplay}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                txn.paymentMethod === "gcash"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}>
                                {txn.paymentMethodDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">{txn.amountPaidDisplay}</td>
                            <td className="px-4 py-3 text-right font-medium">{txn.changeDisplay}</td>
                          </tr>
                          {isOpenRow && (
                            <tr className="bg-muted/5">
                              <td className="px-4 py-3" colSpan={6}>
                                <table className="w-full text-left border-collapse text-sm">
                                  <thead>
                                    <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                      <th className="px-4 py-2">Product</th>
                                      <th className="px-4 py-2 text-center">Qty</th>
                                      <th className="px-4 py-2 text-right">Price</th>
                                      <th className="px-4 py-2 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {txn.items.length === 0 ? (
                                      <tr><td colSpan={4} className="px-4 py-3 text-muted-foreground">No items available.</td></tr>
                                    ) : (
                                      txn.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td className="px-4 py-2">{item.productName}</td>
                                          <td className="px-4 py-2 text-center font-medium">{item.quantity}</td>
                                          <td className="px-4 py-2 text-right font-medium">₱{item.price.toFixed(2)}</td>
                                          <td className="px-4 py-2 text-right font-medium">₱{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                      ))
                                    )}
                                    <tr className="font-bold text-foreground">
                                      <td className="px-4 py-2 text-right" colSpan={3}>Total</td>
                                      <td className="px-4 py-2 text-right text-primary">₱{txn.totalAmount.toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button onClick={onClose} className="h-11 px-6 border border-border text-foreground hover:bg-muted rounded-lg text-sm font-bold transition-all">Close</button>
        </div>
      </div>
    </div>
  )
}
