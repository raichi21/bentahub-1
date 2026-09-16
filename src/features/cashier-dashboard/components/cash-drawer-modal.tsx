"use client"

import { useState, useMemo, useEffect } from "react"
import {
  X,
  Wallet,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  History,
  ArrowRight,
} from "lucide-react"
import type { CashDrawerSession, LastClosedSessionInfo } from "@/types/cashier"
import { formatPeso } from "@/types/cashier"

const DENOMINATIONS = [
  { value: 1000, label: "₱1,000" },
  { value: 500, label: "₱500" },
  { value: 100, label: "₱100" },
  { value: 50, label: "₱50" },
  { value: 20, label: "₱20" },
]

interface CashDrawerModalProps {
  mode: "open" | "close"
  session: CashDrawerSession | null
  lastClosedSession?: LastClosedSessionInfo | null
  isLoading?: boolean
  onOpen: (startingCash: number, notes?: string) => Promise<void>
  onCloseShift: (actualEndingCash: number, notes?: string) => Promise<void>
  onDismiss: () => void
}

export function CashDrawerModal({
  mode,
  session,
  lastClosedSession,
  isLoading,
  onOpen,
  onCloseShift,
  onDismiss,
}: CashDrawerModalProps) {
  const [startingCash, setStartingCash] = useState("")
  const [actualCash, setActualCash] = useState("")
  const [notes, setNotes] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState([0, 0, 0, 0, 0])

  const updateCount = (index: number, delta: number) =>
    setCounts((prev) =>
      prev.map((c, i) => (i === index ? Math.max(0, c + delta) : c))
    )

  const total = useMemo(
    () => DENOMINATIONS.reduce((sum, d, i) => sum + d.value * counts[i], 0),
    [counts]
  )

  useEffect(() => {
    const t = setTimeout(() => setCounts([0, 0, 0, 0, 0]), 0)
    return () => clearTimeout(t)
  }, [mode])

  const handleOpen = async () => {
    const val = parseFloat(startingCash)
    if (!Number.isFinite(val) || val < 0) {
      setError("Enter a valid starting cash float")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onOpen(val, notes || undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open cash drawer")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onCloseShift(parseFloat(actualCash) || 0, notes || undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to close cash drawer")
      setConfirming(false)
    } finally {
      setSubmitting(false)
    }
  }

  const actualVal = parseFloat(actualCash)
  const expected = session ? Number(session.expectedEndingCash ?? 0) : 0
  const difference = Number.isFinite(actualVal) ? actualVal - expected : null

  return (
    <div className="fixed inset-0 z-[120] flex animate-in items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm duration-200 fade-in">
      <div className="flex max-h-[90vh] w-full max-w-md animate-in flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl duration-200 zoom-in">
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">
              {mode === "open" ? "Open Cash Drawer" : "Close Cash Drawer"}
            </h2>
          </div>
          {mode === "open" && (
            <button
              onClick={onDismiss}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-6">
          {mode === "open" ? (
            <>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <p className="mb-1 font-semibold text-card-foreground">
                  Starting Float
                </p>
                <p className="text-xs">
                  Ilagay muna ang perang naiwan sa cash drawer mula sa nakaraang
                  shift (hal. ₱500 na panukli) bago magsimula sa pagbebenta.
                </p>
              </div>

              {lastClosedSession && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <History className="h-3.5 w-3.5 text-primary" />
                      Huling Naiwang Benta / Turnover
                    </span>
                    {lastClosedSession.closedAt && (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(
                          lastClosedSession.closedAt
                        ).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {new Date(
                          lastClosedSession.closedAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-base font-extrabold text-foreground">
                        {formatPeso(
                          lastClosedSession.actualEndingCash ??
                            lastClosedSession.expectedEndingCash
                        )}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {lastClosedSession.cashierName
                          ? `Isinara ni ${lastClosedSession.cashierName}`
                          : "Mula sa nakaraang shift"}
                        {lastClosedSession.notes
                          ? ` • "${lastClosedSession.notes}"`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val =
                          lastClosedSession.actualEndingCash ??
                          lastClosedSession.expectedEndingCash
                        if (val !== null && val !== undefined) {
                          setStartingCash(String(Number(val)))
                        }
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      Gamitin Ito
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Additional Cash
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-muted-foreground">
                    ₱
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startingCash}
                    onChange={(e) =>
                      setStartingCash(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="0.00"
                    autoFocus
                    className="w-full rounded-lg border border-border bg-background py-3 pr-4 pl-9 font-mono text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  (= mga bills mula sa counter + karagdagang halaga)
                </p>
              </div>

              {/* Bill Counter */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Bill Counter
                </label>
                <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                  {DENOMINATIONS.map((denom, i) => (
                    <div key={denom.value} className="flex items-center gap-2">
                      <span className="w-14 text-xs font-semibold text-muted-foreground">
                        {denom.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCount(i, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-red-500 hover:text-white"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-mono text-sm font-bold">
                        {counts[i]}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCount(i, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-blue-600 hover:text-white"
                      >
                        +
                      </button>
                      <span className="flex-1 text-right font-mono text-xs text-muted-foreground">
                        {formatPeso(denom.value * counts[i])}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      GRAND TOTAL
                    </span>
                    <span className="font-mono font-extrabold">
                      {formatPeso(total + (parseFloat(startingCash) || 0))}
                    </span>
                  </div>
                </div>
                {total > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartingCash(
                        String(total + (parseFloat(startingCash) || 0))
                      )
                      setCounts([0, 0, 0, 0, 0])
                    }}
                    className="w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    ✓ Use This Total
                  </button>
                )}
              </div>

              {error && (
                <p className="text-xs font-medium text-red-600">{error}</p>
              )}

              <button
                type="button"
                onClick={handleOpen}
                disabled={submitting || isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="h-4 w-4" />
                )}
                {submitting ? "Opening..." : "Open Shift"}
              </button>
            </>
          ) : session ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opened</span>
                  <span className="font-mono font-semibold">
                    {new Date(session.openedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Float</span>
                  <span className="font-mono font-semibold">
                    {formatPeso(session.startingCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Expected Ending Cash
                  </span>
                  <span className="font-mono font-semibold">
                    {formatPeso(session.expectedEndingCash)}
                  </span>
                </div>
              </div>

              {!confirming ? (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Actual Ending Cash
                    </label>
                    <div className="relative">
                      <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-muted-foreground">
                        ₱
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={actualCash}
                        onChange={(e) =>
                          setActualCash(e.target.value.replace(/[^\d.]/g, ""))
                        }
                        placeholder="0.00"
                        autoFocus
                        className="w-full rounded-lg border border-border bg-background py-3 pr-4 pl-9 font-mono text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Bill Counter
                      </label>
                      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                        {DENOMINATIONS.map((denom, i) => (
                          <div
                            key={denom.value}
                            className="flex items-center gap-2"
                          >
                            <span className="w-14 text-xs font-semibold text-muted-foreground">
                              {denom.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCount(i, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-red-500 hover:text-white"
                            >
                              −
                            </button>
                            <span className="w-12 text-center font-mono text-sm font-bold">
                              {counts[i]}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCount(i, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-all hover:bg-blue-600 hover:text-white"
                            >
                              +
                            </button>
                            <span className="flex-1 text-right font-mono text-xs text-muted-foreground">
                              {formatPeso(denom.value * counts[i])}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-border pt-2">
                          <span className="text-xs font-bold text-muted-foreground">
                            GRAND TOTAL
                          </span>
                          <span className="font-mono font-extrabold">
                            {formatPeso(total + (parseFloat(actualCash) || 0))}
                          </span>
                        </div>
                      </div>
                      {total > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActualCash(
                              String(total + (parseFloat(actualCash) || 0))
                            )
                            setCounts([0, 0, 0, 0, 0])
                          }}
                          className="w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                        >
                          ✓ Use This Total
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Hal. may kulang na ₱20 sa panukli"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-primary"
                    />
                  </div>

                  {error && (
                    <p className="text-xs font-medium text-red-600">{error}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!Number.isFinite(actualVal) || actualVal < 0) {
                        setError("Enter a valid actual ending cash count")
                        return
                      }
                      setError(null)
                      setConfirming(true)
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-red-200 bg-card text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Count Actual & Close Shift
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <p className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                      <AlertTriangle className="h-4 w-4" /> Ikumpirma ang
                      pagsasara
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Expected Ending Cash</span>
                        <span className="font-mono font-bold">
                          {formatPeso(session.expectedEndingCash)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Ending Cash</span>
                        <span className="font-mono font-bold">
                          {formatPeso(actualVal)}
                        </span>
                      </div>
                      {difference !== null && Math.abs(difference) >= 0.005 && (
                        <div className="flex justify-between font-bold">
                          <span>{difference > 0 ? "Sobra" : "Kulang"}</span>
                          <span className="font-mono">
                            {formatPeso(Math.abs(difference))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs font-medium text-red-600">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false)
                        setError(null)
                      }}
                      disabled={submitting}
                      className="h-12 flex-1 rounded-lg border border-border text-sm font-bold text-muted-foreground transition-all hover:bg-muted disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseConfirm}
                      disabled={submitting || isLoading}
                      className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {submitting ? "Closing..." : "Confirm Close"}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No open cash drawer session.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
