"use client"

import { useState } from "react"
import { X, Wallet, Coins, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import type { CashDrawerSession } from "@/types/cashier"
import { formatPeso } from "@/types/cashier"
import { cn } from "@/lib/utils"

const PRESET_AMOUNTS = [500, 1000, 1500, 2000]

interface CashDrawerModalProps {
  mode: "open" | "close"
  session: CashDrawerSession | null
  isLoading?: boolean
  onOpen: (startingCash: number, notes?: string) => Promise<void>
  onCloseShift: (actualEndingCash: number, notes?: string) => Promise<void>
  onDismiss: () => void
}

export function CashDrawerModal({
  mode,
  session,
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">
              {mode === "open" ? "Open Cash Drawer" : "Close Cash Drawer"}
            </h2>
          </div>
          {mode === "open" && (
            <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {mode === "open" ? (
            <>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
                <p className="font-semibold text-card-foreground mb-1">Starting Float</p>
                <p className="text-xs">
                  Ipasok ang perang naiwan sa cash drawer mula sa nakaraang shift (hal. ₱500 para sa panukli) bago magsimulang magbenta.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Starting Cash</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-9 pr-4 py-3 text-lg font-bold font-mono bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStartingCash(String(amt))}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors",
                      startingCash === String(amt)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    ₱{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

              <button
                type="button"
                onClick={handleOpen}
                disabled={submitting || isLoading}
                className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                {submitting ? "Opening..." : "Open Shift"}
              </button>
            </>
          ) : session ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opened</span>
                  <span className="font-mono font-semibold">{new Date(session.openedAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Float</span>
                  <span className="font-mono font-semibold">{formatPeso(session.startingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Ending Cash</span>
                  <span className="font-mono font-semibold">{formatPeso(session.expectedEndingCash)}</span>
                </div>
              </div>

              {!confirming ? (
                <>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actual Ending Cash</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value.replace(/[^\d.]/g, ""))}
                        placeholder="0.00"
                        autoFocus
                        className="w-full pl-9 pr-4 py-3 text-lg font-bold font-mono bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    {difference !== null && (
                      <p
                        className={cn(
                          "text-xs font-semibold flex items-center gap-1",
                          Math.abs(difference) < 0.005 ? "text-emerald-600" : "text-red-600"
                        )}
                      >
                        {Math.abs(difference) < 0.005 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {Math.abs(difference) < 0.005
                          ? "Tama ang bilang — walang kulang o sobra."
                          : difference > 0
                            ? `Sobra ng ${formatPeso(difference)} sa drawer.`
                            : `Kulang ng ${formatPeso(Math.abs(difference))} sa drawer.`}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Hal. may kulang na ₱20 sa panukli"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-primary focus:border-primary outline-none resize-none"
                    />
                  </div>

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

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
                    className="w-full h-12 bg-card border-2 border-red-200 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Count Actual & Close Shift
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
                    <p className="font-bold text-sm mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Ikumpirma ang pagsasara
                    </p>
                    <div className="space-y-1 text-xs mt-2">
                      <div className="flex justify-between">
                        <span>Expected Ending Cash</span>
                        <span className="font-mono font-bold">{formatPeso(session.expectedEndingCash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Actual Ending Cash</span>
                        <span className="font-mono font-bold">{formatPeso(actualVal)}</span>
                      </div>
                      {difference !== null && Math.abs(difference) >= 0.005 && (
                        <div className="flex justify-between font-bold">
                          <span>{difference > 0 ? "Sobra" : "Kulang"}</span>
                          <span className="font-mono">{formatPeso(Math.abs(difference))}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setConfirming(false); setError(null) }}
                      disabled={submitting}
                      className="flex-1 h-12 border border-border text-muted-foreground rounded-lg text-sm font-bold hover:bg-muted transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseConfirm}
                      disabled={submitting || isLoading}
                      className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {submitting ? "Closing..." : "Confirm Close"}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No open cash drawer session.</p>
          )}
        </div>
      </div>
    </div>
  )
}
