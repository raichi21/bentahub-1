"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  X,
  Camera,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Smartphone,
} from "lucide-react"

interface BarcodeScannerProps {
  onScan: (code: string) => void
  onClose: () => void
}

type ErrorType =
  | "insecure"
  | "no-media"
  | "denied"
  | "not-found"
  | "in-use"
  | "overconstrained"
  | "in-app-browser"
  | "unknown"

function detectInAppBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent || ""
  return /FBAN\/|FBAV\/|Instagram|Messenger|Line\/|MicroMessenger|Snapchat|Twitter|TikTok|WeChat|WhatsApp/i.test(
    ua
  )
}

function getSecureContextMessage(): string {
  const proto = window.location.protocol
  const host = window.location.hostname
  if (
    proto === "https:" ||
    (proto === "http:" &&
      (host === "localhost" || host === "127.0.0.1" || host === "[::1]"))
  ) {
    return ""
  }
  return `Camera access requires a secure connection (HTTPS). You are currently using ${proto}//${host}.`
}

async function checkCameraPermission(): Promise<PermissionState | null> {
  try {
    if (!navigator.permissions) return null
    const status = await navigator.permissions.query({
      name: "camera" as PermissionName,
    })
    return status.state
  } catch {
    return null
  }
}

function mapErrorToType(err: unknown): ErrorType {
  if (detectInAppBrowser()) return "in-app-browser"
  const msg = err instanceof Error ? err.message.toLowerCase() : ""
  if (msg.includes("not allowed") || msg.includes("permission")) return "denied"
  if (msg.includes("not found") || msg.includes("no device")) return "not-found"
  if (msg.includes("not readable") || msg.includes("in use")) return "in-use"
  if (msg.includes("overconstrained")) return "overconstrained"
  if (msg.includes("secure") || msg.includes("https")) return "insecure"
  return "unknown"
}

const ERROR_UI: Record<ErrorType, { title: string; description: string }> = {
  insecure: {
    title: "Camera requires HTTPS",
    description:
      "Browser camera access is only available on secure (HTTPS) connections. Open this page via HTTPS or use manual input below.",
  },
  "no-media": {
    title: "Camera not supported",
    description:
      "Your browser does not support camera access. Try opening this page in Chrome or Safari.",
  },
  denied: {
    title: "Camera permission denied",
    description:
      "Camera access was blocked. You can retry or enable it in your browser settings.",
  },
  "not-found": {
    title: "No camera found",
    description:
      "No camera was detected on this device. Use manual input below.",
  },
  "in-use": {
    title: "Camera is in use",
    description:
      "Another app is using the camera. Close other camera apps and try again.",
  },
  overconstrained: {
    title: "Rear camera unavailable",
    description:
      "Your device does not have a rear-facing camera. Retrying with the front camera.",
  },
  "in-app-browser": {
    title: "Camera blocked in this app",
    description:
      "In-app browsers (Facebook, Messenger, Instagram, etc.) block camera access. Open this page directly in Chrome or Safari instead.",
  },
  unknown: {
    title: "Camera unavailable",
    description: "Could not start the camera. Check permissions and try again.",
  },
}

const PERMISSION_STEPS: Record<string, { label: string; steps: string[] }> = {
  "android-chrome": {
    label: "Android Chrome",
    steps: [
      "Tap the three dots (⋮) in Chrome → Settings",
      "Tap Site settings → Camera",
      "Find this site and tap it",
      'Change to "Allow"',
      'Tap "Try Again" above',
    ],
  },
  "ios-safari": {
    label: "iOS Safari",
    steps: [
      "Open iPhone Settings app (not browser settings)",
      "Scroll down and tap Safari",
      "Tap Camera",
      'Change to "Allow" or "Ask"',
      'Return to Safari and tap "Try Again"',
    ],
  },
}

function getDeviceSteps(): { label: string; steps: string[] } {
  if (typeof window === "undefined") return PERMISSION_STEPS["android-chrome"]
  const ua = navigator.userAgent || ""
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  ) {
    return PERMISSION_STEPS["ios-safari"]
  }
  return PERMISSION_STEPS["android-chrome"]
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const html5QrCodeRef = useRef<unknown>(null)
  const [phase, setPhase] = useState<
    "checking" | "requesting" | "ready" | "error"
  >("checking")
  const [errorType, setErrorType] = useState<ErrorType>("unknown")
  const [manualCode, setManualCode] = useState("")
  const [showSteps, setShowSteps] = useState(false)
  const retryCountRef = useRef(0)
  const stoppedRef = useRef(false)

  const startCamera = useCallback(async () => {
    setPhase("checking")
    stoppedRef.current = false

    // 1. In-app browser check
    if (detectInAppBrowser()) {
      setErrorType("in-app-browser")
      setPhase("error")
      return
    }

    // 2. Secure context check
    const insecureMsg = getSecureContextMessage()
    if (insecureMsg) {
      setErrorType("insecure")
      setPhase("error")
      return
    }

    // 3. mediaDevices check
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorType("no-media")
      setPhase("error")
      return
    }

    // 4. Pre-flight permission check
    const permState = await checkCameraPermission()
    if (permState === "denied") {
      setErrorType("denied")
      setPhase("error")
      return
    }

    // 5. Start scanner
    setPhase("requesting")
    try {
      const { Html5Qrcode } = await import("html5-qrcode")

      const elementId = "cashier-barcode-scanner-element"
      const scanner = new Html5Qrcode(elementId)
      html5QrCodeRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        { fps: 5, qrbox: { width: 300, height: 200 } },
        (decodedText: string) => {
          stoppedRef.current = true
          scanner.stop().catch(() => {})
          onScan(decodedText)
          onClose()
        },
        () => {}
      )

      setPhase("ready")
    } catch (err) {
      // If overconstrained, retry with any available camera
      const errType = mapErrorToType(err)
      if (errType === "overconstrained" && retryCountRef.current === 0) {
        retryCountRef.current += 1
        try {
          const { Html5Qrcode } = await import("html5-qrcode")
          const scanner = new Html5Qrcode("cashier-barcode-scanner-element")
          html5QrCodeRef.current = scanner
          await scanner.start(
            { facingMode: "user" },
            { fps: 5, qrbox: { width: 300, height: 200 } },
            (decodedText: string) => {
              stoppedRef.current = true
              scanner.stop().catch(() => {})
              onScan(decodedText)
              onClose()
            },
            () => {}
          )
          setPhase("ready")
          return
        } catch {
          // Fall through to error
        }
      }
      setErrorType(mapErrorToType(err))
      setPhase("error")
    }
  }, [onScan, onClose])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      await startCamera()
    }

    init()

    return () => {
      cancelled = true
      const s = html5QrCodeRef.current as { stop: () => Promise<void> } | null
      if (s && !stoppedRef.current) {
        try {
          s.stop().catch(() => {})
        } catch {
          /* already stopped */
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0
    stoppedRef.current = false
    // Clean up existing scanner first
    const s = html5QrCodeRef.current as { stop: () => Promise<void> } | null
    if (s) {
      try {
        s.stop().catch(() => {})
      } catch {
        /* already stopped */
      }
      html5QrCodeRef.current = null
    }
    startCamera()
  }, [startCamera])

  const handleManualSubmit = useCallback(() => {
    const code = manualCode.trim()
    if (code) {
      onScan(code)
      onClose()
    }
  }, [manualCode, onScan, onClose])

  const openInBrowser = useCallback(() => {
    const url = window.location.href
    // Try to open in default browser
    window.location.href = url
  }, [])

  const errorInfo = phase === "error" ? ERROR_UI[errorType] : null
  const deviceSteps = getDeviceSteps()

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            Scan Barcode
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner View */}
        <div className="space-y-4 p-6">
          {/* Error state */}
          {phase === "error" && errorInfo && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="mb-1 font-bold">{errorInfo.title}</p>
                    <p>{errorInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* In-app browser: Open in browser button */}
              {errorType === "in-app-browser" && (
                <button
                  onClick={openInBrowser}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/95"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Chrome / Safari
                </button>
              )}

              {/* Permission denied: step-by-step guidance */}
              {errorType === "denied" && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      How to enable camera permission
                    </span>
                    {showSteps ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showSteps && (
                    <div className="px-4 pb-4">
                      <p className="mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        {deviceSteps.label}
                      </p>
                      <ol className="space-y-1.5">
                        {deviceSteps.steps.map((step, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-xs text-muted-foreground"
                          >
                            <span className="font-bold text-foreground">
                              {i + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Retry button (shown for all except in-app-browser and insecure) */}
              {errorType !== "in-app-browser" && errorType !== "insecure" && (
                <button
                  onClick={handleRetry}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-bold text-foreground transition-colors hover:bg-muted"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Scanner View — always rendered so html5-qrcode video stream stays attached */}
          <div className="relative">
            <div
              id="cashier-barcode-scanner-element"
              className="aspect-video w-full overflow-hidden rounded-lg bg-black"
            />
            {(phase === "checking" || phase === "requesting") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/60 text-white">
                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                <p className="text-sm">
                  {phase === "checking"
                    ? "Checking camera..."
                    : "Starting camera..."}
                </p>
              </div>
            )}
            {phase === "ready" && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Point the camera at a barcode
              </p>
            )}
          </div>

          {/* Manual input — always visible */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
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
                className="h-11 flex-1 rounded-lg border border-border bg-background px-4 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoFocus={phase === "error"}
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/95 disabled:opacity-40"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
