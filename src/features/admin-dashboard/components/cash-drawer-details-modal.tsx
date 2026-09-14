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

export function CashDrawerDetailsModal({
  isOpen,
  onClose,
  session,
}: CashDrawerDetailsModalProps) {
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
    <div className="fixed inset-0 z-[100] flex animate-in items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm duration-200 fade-in print:hidden">
      <div className="my-auto flex max-h-[90vh] w-full max-w-3xl animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">
              Cash Drawer Session - {session.displayId}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                session.status === "open"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {session.statusDisplay}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="custom-scrollbar space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div className="space-y-1.5 text-sm">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Session Info
              </h4>
              <p className="text-muted-foreground">
                Status:{" "}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                    session.status === "open"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {session.statusDisplay}
                </span>
              </p>
              <p className="text-muted-foreground">
                Branch:{" "}
                <span className="font-semibold text-foreground">
                  {session.branchName}
                </span>
              </p>
              <p className="text-muted-foreground">
                Cashier:{" "}
                <span className="font-semibold text-foreground">
                  {session.cashierName}
                </span>
              </p>
              <p className="text-muted-foreground">
                Opened:{" "}
                <span className="font-semibold text-foreground">
                  {formatTime(session.openedAtDisplay)}
                </span>
              </p>
              <p className="text-muted-foreground">
                Closed:{" "}
                <span className="font-semibold text-foreground">
                  {formatTime(session.closedAtDisplay)}
                </span>
              </p>
            </div>
            <div className="space-y-1.5 text-sm">
              <h4 className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Cash Reconciliation
              </h4>
              <p className="text-muted-foreground">
                Starting:{" "}
                <span className="font-semibold text-foreground">
                  {session.startingCashDisplay}
                </span>
              </p>
              <p className="text-muted-foreground">
                Expected Ending:{" "}
                <span className="font-semibold text-foreground">
                  {session.expectedEndingCashDisplay}
                </span>
              </p>
              <p className="text-muted-foreground">
                Actual Ending:{" "}
                <span className="font-semibold text-foreground">
                  {session.actualEndingCashDisplay}
                </span>
              </p>
              <p className="text-muted-foreground">
                Net Impact:{" "}
                <span className="font-semibold text-foreground">
                  {session.netCashImpactDisplay}
                </span>
              </p>
              <p className="text-muted-foreground">
                Difference:{" "}
                <span className="font-semibold text-foreground">
                  {session.diffDisplay}
                </span>
              </p>
            </div>
          </div>

          {session.notes && (
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <h4 className="mb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Notes
              </h4>
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {session.notes}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Transactions{summary ? ` (${summary.transactionCount})` : ""}
              </h4>
              {summary && (
                <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {summary.cashCount} cash • {summary.cashTotalDisplay}
                  </span>
                  <span className="text-border">|</span>
                  <span>
                    {summary.gcashCount} gcash • {summary.gcashTotalDisplay}
                  </span>
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
              <div className="p-6 text-center text-sm text-red-500">
                Error: {error}
              </div>
            )}

            {!loading && !error && data && data.transactions.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <FileX className="h-7 w-7" />
                </div>
                <p className="font-semibold text-foreground">
                  No transactions in this session.
                </p>
                <p className="text-sm text-muted-foreground">
                  Cash and GCash transactions will appear here.
                </p>
              </div>
            )}

            {!loading && !error && data && data.transactions.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="border-b border-border bg-muted/10">
                      <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        <th className="w-8 px-3 py-3 sm:px-4"></th>
                        <th className="px-3 py-3 sm:px-4">Transaction</th>
                        <th className="px-3 py-3 sm:px-4">Total</th>
                        <th className="px-3 py-3 sm:px-4">Method</th>
                        <th className="px-3 py-3 text-right sm:px-4">
                          Amount Paid
                        </th>
                        <th className="px-3 py-3 text-right sm:px-4">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-foreground">
                      {data.transactions.map((txn) => {
                        const isOpenRow = expanded.has(txn.id)
                        return (
                          <Fragment key={txn.id}>
                            <tr
                              onClick={() => toggleExpand(txn.id)}
                              className="cursor-pointer transition-colors hover:bg-muted/30"
                            >
                              <td className="px-3 py-3 sm:px-4">
                                {isOpenRow ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-4">
                                <span className="font-mono font-medium text-foreground">
                                  {txn.displayId}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {txn.createdAtDisplay}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-medium whitespace-nowrap sm:px-4">
                                {txn.totalAmountDisplay}
                              </td>
                              <td className="px-3 py-3 sm:px-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${
                                    txn.paymentMethod === "gcash"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  {txn.paymentMethodDisplay}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">
                                {txn.amountPaidDisplay}
                              </td>
                              <td className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">
                                {txn.changeDisplay}
                              </td>
                            </tr>
                            {isOpenRow && (
                              <tr className="bg-muted/5">
                                <td className="px-3 py-3 sm:px-4" colSpan={6}>
                                  <div className="overflow-x-auto">
                                    <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                                      <thead>
                                        <tr className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                          <th className="px-2 py-2 sm:px-4">
                                            Product
                                          </th>
                                          <th className="px-2 py-2 text-center sm:px-4">
                                            Qty
                                          </th>
                                          <th className="px-2 py-2 text-right sm:px-4">
                                            Price
                                          </th>
                                          <th className="px-2 py-2 text-right sm:px-4">
                                            Subtotal
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/30">
                                        {txn.items.length === 0 ? (
                                          <tr>
                                            <td
                                              colSpan={4}
                                              className="px-2 py-3 text-muted-foreground sm:px-4"
                                            >
                                              No items available.
                                            </td>
                                          </tr>
                                        ) : (
                                          txn.items.map((item, idx) => (
                                            <tr key={idx}>
                                              <td
                                                className="max-w-[160px] truncate px-2 py-2 sm:max-w-none sm:px-4"
                                                title={item.productName}
                                              >
                                                {item.productName}
                                              </td>
                                              <td className="px-2 py-2 text-center font-medium whitespace-nowrap sm:px-4">
                                                {item.quantity}
                                              </td>
                                              <td className="px-2 py-2 text-right font-medium whitespace-nowrap sm:px-4">
                                                ₱{item.price.toFixed(2)}
                                              </td>
                                              <td className="px-2 py-2 text-right font-medium whitespace-nowrap sm:px-4">
                                                ₱{item.subtotal.toFixed(2)}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                        <tr className="font-bold text-foreground">
                                          <td
                                            className="px-2 py-2 text-right sm:px-4"
                                            colSpan={3}
                                          >
                                            Total
                                          </td>
                                          <td className="px-2 py-2 text-right whitespace-nowrap text-primary sm:px-4">
                                            ₱{txn.totalAmount.toFixed(2)}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-6 text-sm font-bold text-foreground transition-all hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
