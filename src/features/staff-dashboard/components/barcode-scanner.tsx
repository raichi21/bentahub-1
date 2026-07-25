"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, Camera, Loader2 } from "lucide-react"

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<unknown>(null)
  const [scannerReady, setScannerReady] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")

  // Dynamically import html5-qrcode (avoids SSR issues)
  useEffect(() => {
    let cancelled = false

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode")

        if (cancelled) return

        const elementId = "barcode-scanner-element"
        const scanner = new Html5Qrcode(elementId)
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText: string) => {
            scanner.stop().catch(() => {})
            onScan(decodedText)
          },
          () => { /* ignore intermediate frames */ },
        )

        if (!cancelled) setScannerReady(true)
      } catch (err) {
        if (!cancelled) {
          setScannerError(err instanceof Error ? err.message : "Camera access denied")
        }
      }
    }

    startScanner()

    return () => {
      cancelled = true
      const s = html5QrCodeRef.current as { stop: () => Promise<void> } | null
      if (s) {
        s.stop().catch(() => {})
      }
    }
  }, [onScan])

  const handleManualSubmit = useCallback(() => {
    const code = manualCode.trim()
    if (code) {
      onScan(code)
    }
  }, [manualCode, onScan])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Scan Barcode
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner View */}
        <div className="p-6 space-y-4">
          {scannerError ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-bold mb-1">Camera unavailable</p>
                <p>{scannerError}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can manually type the barcode number below instead.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div id="barcode-scanner-element" ref={containerRef} className="w-full aspect-video bg-black rounded-lg overflow-hidden" />
              {!scannerReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg text-white">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">Starting camera...</p>
                </div>
              )}
              {scannerReady && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Point the camera at a barcode
                </p>
              )}
            </div>
          )}

          {/* Manual Fallback */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Or type barcode number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualSubmit()
                }}
                placeholder="Type or scan barcode..."
                className="flex-1 h-11 px-4 bg-background border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="h-11 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/95 disabled:opacity-40 transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-5 border border-border text-muted-foreground hover:bg-muted rounded-lg text-sm font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
