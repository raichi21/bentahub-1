"use client"

import { useEffect, useState } from "react"
import {
  X,
  Printer,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bluetooth,
  Usb,
  Unplug,
  Settings2,
} from "lucide-react"
import { jsPDF } from "jspdf"
import { useAuth } from "@/hooks/useAuth"
import { useStoreSettings } from "@/hooks/useStoreSettings"
import {
  autoConnectThermal,
  buildThermalReceipt,
  connectBluetooth,
  connectUsb,
  disconnectThermal,
  getConnection,
  isBluetoothSupported,
  isSerialSupported,
  printThermal,
  subscribeThermal,
  type ThermalConnection,
} from "@/lib/thermal-print"
import type { Transaction } from "@/types/cashier"
import { cn } from "@/lib/utils"

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
}

const PRINT_SERVER_URL = process.env.NEXT_PUBLIC_PRINT_SERVER_URL?.trim() || ""

function buildReceiptPdf(
  transaction: Transaction,
  storeName: string,
  dateStr: string
) {
  const doc = new jsPDF()
  const w = doc.internal.pageSize.getWidth()
  const right = w - 14
  let y = 16

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(`${storeName} Retail`, w / 2, y, { align: "center" })
  y += 7

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Receipt No: BH-${String(transaction.receiptNumber).padStart(6, "0")}`,
    w / 2,
    y,
    { align: "center" }
  )
  y += 5
  doc.text(`Date: ${dateStr}`, w / 2, y, { align: "center" })
  y += 5
  doc.text(`Cashier: ${transaction.cashier}`, w / 2, y, { align: "center" })
  y += 5
  doc.text(`Status: ${transaction.status.toUpperCase()}`, w / 2, y, {
    align: "center",
  })
  y += 12

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Items", 14, y)
  y += 6

  doc.setFont("helvetica", "normal")
  transaction.items.forEach((item) => {
    doc.text(`${item.qty} x ${item.name}`, 14, y)
    doc.text(`\u20B1${(item.qty * item.price).toFixed(2)}`, right, y, {
      align: "right",
    })
    y += 6
  })
  y += 4

  doc.text("Subtotal", 14, y)
  doc.text(`\u20B1${transaction.subtotal.toFixed(2)}`, right, y, {
    align: "right",
  })
  y += 6

  if (transaction.discount > 0) {
    doc.text("Discount", 14, y)
    doc.text(`-\u20B1${transaction.discount.toFixed(2)}`, right, y, {
      align: "right",
    })
    y += 6
  }

  doc.setFont("helvetica", "bold")
  doc.text("Total Bill", 14, y)
  doc.text(`\u20B1${transaction.total.toFixed(2)}`, right, y, {
    align: "right",
  })
  y += 6

  doc.setFont("helvetica", "normal")
  doc.text("Amount Paid", 14, y)
  doc.text(`\u20B1${transaction.amountPaid.toFixed(2)}`, right, y, {
    align: "right",
  })
  y += 6
  doc.text("Change Due", 14, y)
  doc.text(`\u20B1${transaction.change.toFixed(2)}`, right, y, {
    align: "right",
  })
  y += 6
  doc.text("Payment Type", 14, y)
  doc.text(transaction.paymentMethod.toUpperCase(), right, y, {
    align: "right",
  })
  y += 14

  doc.setFontSize(9)
  doc.text(`Thank you for shopping with ${storeName}!`, w / 2, y, {
    align: "center",
  })
  y += 5
  doc.text("Please keep this receipt for return/refund requests.", w / 2, y, {
    align: "center",
  })

  doc.save(
    `receipt-BH-${String(transaction.receiptNumber).padStart(6, "0")}.pdf`
  )
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const { user } = useAuth()
  const { storeName } = useStoreSettings()
  const [printing, setPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState<"idle" | "success" | "error">(
    "idle"
  )
  const [printMessage, setPrintMessage] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [showPrinterSettings, setShowPrinterSettings] = useState(false)
  const [connection, setConnection] = useState<ThermalConnection | null>(() =>
    getConnection()
  )
  const canBluetooth = isBluetoothSupported()
  const canSerial = isSerialSupported()
  const hasAnyThermalSupport = canBluetooth || canSerial

  useEffect(() => {
    return subscribeThermal(() => setConnection(getConnection()))
  }, [])

  if (!transaction) return null

  const dateObj = new Date(transaction.date)
  const formattedDate = dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const isCancelled = transaction.status === "cancelled"

  const handleConnect = async (type: "bluetooth" | "usb") => {
    setConnecting(true)
    setPrintStatus("idle")
    setPrintMessage("")
    try {
      if (type === "bluetooth") {
        await connectBluetooth()
      } else {
        await connectUsb()
      }
      setPrintStatus("success")
      setPrintMessage("Thermal printer connected")
    } catch (err) {
      // User cancelled the picker — not an error.
      if (err instanceof Error && err.name === "NotFoundError") {
        setPrintStatus("idle")
      } else {
        setPrintStatus("error")
        setPrintMessage(
          err instanceof Error ? err.message : "Printer connection failed"
        )
      }
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setConnecting(true)
    try {
      await disconnectThermal()
    } finally {
      setConnecting(false)
    }
  }

  const handlePrint = async () => {
    setPrinting(true)
    setPrintStatus("idle")
    setPrintMessage("")

    try {
      // 1) Thermal: auto-connect to a granted/picked printer, then print.
      let thermal = getConnection()
      if (!thermal) {
        try {
          thermal = await autoConnectThermal()
        } catch {
          // No printer granted/picked yet → server / PDF fallback below.
        }
      }
      if (thermal) {
        try {
          await printThermal(
            buildThermalReceipt(
              transaction,
              storeName,
              user?.branch ?? "",
              formattedDate
            )
          )
          setPrintStatus("success")
          setPrintMessage(`Receipt printed to: ${thermal.name}`)
          return
        } catch {
          // Fall through to the print server / PDF below.
        }
      }

      // 2) Windows print server configured → try it.
      if (PRINT_SERVER_URL) {
        try {
          const res = await fetch(`${PRINT_SERVER_URL}/print`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiptNumber: transaction.receiptNumber,
              date: formattedDate,
              cashier: transaction.cashier,
              status: transaction.status,
              storeName,
              branch: user?.branch ?? "",
              paperWidth: "58mm",
              items: transaction.items,
              subtotal: transaction.subtotal,
              discount: transaction.discount,
              total: transaction.total,
              paymentMethod: transaction.paymentMethod,
              amountPaid: transaction.amountPaid,
              change: transaction.change,
            }),
          })

          const json = await res.json()

          if (json.success && json.printed) {
            setPrintStatus("success")
            setPrintMessage(json.message || "Receipt printed successfully")
            return
          }
          if (json.success) {
            setPrintStatus("success")
            setPrintMessage(json.message || "Receipt saved to file")
            return
          }
          setPrintStatus("error")
          setPrintMessage(json.message || "Print failed")
          return
        } catch {
          // Print server unreachable → fall back to PDF.
        }
      }

      // 3) PDF fallback.
      buildReceiptPdf(transaction, storeName, formattedDate)
      setPrintStatus("success")
      setPrintMessage(
        PRINT_SERVER_URL
          ? "Print server unavailable — receipt saved as PDF"
          : thermal
            ? "Thermal print failed — receipt saved as PDF"
            : "I-connect muna ang thermal printer, o i-save bilang PDF"
      )
    } catch {
      setPrintStatus("error")
      setPrintMessage("Failed to generate receipt PDF")
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 p-4 backdrop-blur-xs">
      <div className="animate-scale-up relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
          <span className="text-xs font-bold text-muted-foreground">
            Transaction Receipt
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-card-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Paper Receipt Panel */}
        <div className="relative flex-1 space-y-4 overflow-y-auto p-6 font-sans">
          {isCancelled && (
            <div className="backdrop-blur-2xs pointer-events-none absolute inset-0 flex items-center justify-center bg-red-500/5 select-none">
              <span className="-rotate-12 transform rounded-xl border-4 border-red-600/30 p-2 text-3xl font-black tracking-widest text-red-600/30 uppercase">
                Cancelled
              </span>
            </div>
          )}

          {/* Business branding */}
          <div className="text-center">
            <h3 className="text-lg font-black tracking-tight text-card-foreground">
              {storeName} Retail
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground">
              {user?.branch ?? ""}
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              Receipt No: BH-
              {String(transaction.receiptNumber).padStart(6, "0")}
            </p>
          </div>

          <div className="my-4 border-t border-dashed border-border"></div>

          {/* Details header */}
          <div className="space-y-1 text-xs font-medium text-muted-foreground">
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-mono text-card-foreground/80">
                {formattedDate}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span className="text-card-foreground/80">
                {transaction.cashier}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-wider uppercase",
                  isCancelled ? "text-red-500" : "text-green-600"
                )}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-border"></div>

          {/* Items checklist */}
          <div className="space-y-3">
            {transaction.items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-xs"
              >
                <div className="max-w-[70%]">
                  <p className="font-bold text-card-foreground">{item.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {item.qty} x ₱{item.price.toFixed(2)}
                  </p>
                </div>
                <span className="font-mono font-bold text-card-foreground/80">
                  ₱{(item.qty * item.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-border"></div>

          {/* Totals log */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-medium text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono text-card-foreground/80">
                ₱{transaction.subtotal.toFixed(2)}
              </span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between font-medium text-red-500">
                <span>Discount</span>
                <span className="font-mono">
                  -₱{transaction.discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-2 text-sm font-black text-card-foreground">
              <span>Total Bill</span>
              <span className="font-mono text-base text-primary">
                ₱{transaction.total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-border"></div>

          {/* Payment receipt info */}
          <div className="space-y-1 text-xs font-medium text-muted-foreground">
            <div className="flex justify-between">
              <span>Payment Type:</span>
              <span className="font-bold text-card-foreground/80 uppercase">
                {transaction.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span className="font-mono text-card-foreground/80">
                ₱{transaction.amountPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Change Due:</span>
              <span className="font-mono text-card-foreground/80">
                ₱{transaction.change.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Thank you phrase */}
          <div className="pt-4 text-center">
            <p className="text-[10px] text-muted-foreground italic">
              Thank you for shopping with {storeName}!
            </p>
            <p className="mt-1 font-mono text-[9px] text-muted-foreground/60">
              Please keep this receipt for return/refund requests
            </p>
          </div>
        </div>

        {/* Print Status Banner */}
        {printStatus !== "idle" && (
          <div
            className={cn(
              "flex items-center gap-2 border-b px-4 py-2 text-xs font-bold",
              printStatus === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            )}
          >
            {printStatus === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{printMessage}</span>
          </div>
        )}

        {/* Action Panel */}
        <div className="space-y-3 border-t border-border bg-muted p-4">
          {/* Thermal printer status + settings toggle */}
          {hasAnyThermalSupport ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {connection ? (
                    connection.kind === "bluetooth" ? (
                      <Bluetooth className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Usb className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )
                  ) : (
                    <Printer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-[10px] font-medium text-muted-foreground">
                    {connection
                      ? connection.name
                      : "Auto-print gamit ang thermal printer"}
                  </span>
                </div>
                <button
                  onClick={() => setShowPrinterSettings(!showPrinterSettings)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-bold transition-colors",
                    showPrinterSettings
                      ? "bg-accent text-card-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-card-foreground"
                  )}
                  title="Printer settings"
                >
                  <Settings2 className="h-3 w-3" />
                  <span>Printer settings</span>
                </button>
              </div>

              {/* Printer settings (collapsible) */}
              {showPrinterSettings && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-2">
                  {connection ? (
                    <div className="flex min-w-0 items-center gap-1.5">
                      {connection.kind === "bluetooth" ? (
                        <Bluetooth className="h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <Usb className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <span className="truncate text-[10px] font-bold text-card-foreground">
                        {connection.name}
                      </span>
                      <button
                        onClick={handleDisconnect}
                        disabled={connecting}
                        className="ml-1 rounded-lg border border-border p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-card-foreground disabled:opacity-60"
                        title="Disconnect printer"
                      >
                        <Unplug className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate text-[10px] font-medium text-muted-foreground">
                      Pumili ng printer (isang beses lang; pagkatapos ay
                      auto-connect na ito)
                    </span>
                  )}

                  {!connection && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {canBluetooth && (
                        <button
                          onClick={() => handleConnect("bluetooth")}
                          disabled={connecting}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-card-foreground disabled:opacity-60"
                        >
                          {connecting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bluetooth className="h-3 w-3" />
                          )}
                          <span>Bluetooth</span>
                        </button>
                      )}
                      {canSerial && (
                        <button
                          onClick={() => handleConnect("usb")}
                          disabled={connecting}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-accent hover:text-card-foreground disabled:opacity-60"
                        >
                          {connecting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Usb className="h-3 w-3" />
                          )}
                          <span>USB</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-[10px] font-medium text-muted-foreground">
              Hindi suportado ang direct thermal printing sa browser na ito
              (iOS/Safari). Gumamit ng Print via Server o Save as PDF.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-colors hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {printing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span>{printing ? "Printing..." : "Print Receipt"}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
