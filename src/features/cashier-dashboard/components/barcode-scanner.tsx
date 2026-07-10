"use client"

import { useEffect, useRef, useState } from "react"
import { X, Camera, Loader2, ScanLine, Type } from "lucide-react"

// CDN-loaded Html5Qrcode — no type definitions available
interface Html5QrcodeInstance {
  start(config: unknown, options: unknown, onScan: (text: string) => void, onError: () => void): Promise<void>
  stop(): Promise<void>
  scanFile(file: File, _: boolean): Promise<string>
  clear(): void
}

type Html5QrcodeConstructor = new (id: string) => Html5QrcodeInstance

const getHtml5Qrcode = (): Html5QrcodeConstructor => (window as unknown as { Html5Qrcode: Html5QrcodeConstructor }).Html5Qrcode

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

type Mode = "loading" | "live" | "photo"

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [libLoaded, setLibLoaded] = useState(false)
  const [libError, setLibError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("loading")
  const [decoding, setDecoding] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const scannerRef = useRef<Html5QrcodeInstance | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualBarcode.trim()
    if (trimmed) {
      onScan(trimmed)
      onClose()
    }
  }

  // Load html5-qrcode from CDN
  useEffect(() => {
    if (typeof getHtml5Qrcode() !== "undefined") {
      const timer = setTimeout(() => setLibLoaded(true), 0)
      return () => clearTimeout(timer)
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/html5-qrcode"
    script.async = true
    script.onload = () => setLibLoaded(true)
    script.onerror = () => {
      setLibError("Failed to load barcode scanner library")
    }
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  // Try live camera when library loads
  useEffect(() => {
    if (!libLoaded || mode !== "loading") return

    const startScanner = async () => {
      try {
        const Html5Qrcode = getHtml5Qrcode()
        const scanner = new Html5Qrcode("barcode-scanner-view")
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
            onClose()
          },
          () => {},
        )
        setMode("live")
      } catch {
        // Camera failed — switch to photo mode
        setMode("photo")
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [libLoaded, mode, onScan, onClose])

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDecoding(true)
    try {
      const Html5Qrcode = getHtml5Qrcode()
      const scanner = new Html5Qrcode("barcode-scanner-photo")
      const result = await scanner.scanFile(file, true)
      onScan(result)
      scanner.clear()
      onClose()
    } catch {
      setDecoding(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Scan Barcode</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {libError ? (
            <div className="aspect-video bg-slate-50 rounded-xl flex items-center justify-center p-6">
              <p className="text-sm text-red-500 text-center">{libError}</p>
            </div>
          ) : mode === "loading" ? (
            <div className="aspect-video bg-slate-50 rounded-xl flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs text-slate-500">Starting camera...</p>
              </div>
            </div>
          ) : mode === "live" ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50">
              <div id="barcode-scanner-view" className="w-full h-full" />
            </div>
          ) : (
            /* Photo Mode — fallback pag ayaw ng camera */
            <div className="aspect-video bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-4 p-6">
              <div id="barcode-scanner-photo" className="hidden" />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  Take a photo
                </p>
                <p className="text-xs text-slate-500">
                  I-tutok ang camera sa barcode at picture-an
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileScan}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={decoding}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {decoding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Decoding...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual barcode entry — separate na para kita sa phone */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">or</span>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={manualInputRef}
                  type="text"
                  inputMode="numeric"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Type barcode number..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-slate-100 bg-slate-50">
          <Camera className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            {mode === "live" ? "Point camera at barcode" : "Take photo or type barcode number"}
          </p>
        </div>
      </div>
    </div>
  )
}
