// ---------------------------------------------------------------------------
// Thermal ESC/POS receipt printing (58mm) via Web Bluetooth / Web Serial.
// Works in Chrome or Edge on Windows + Android. Module-scoped singleton so the
// printer connection survives the receipt modal opening/closing.
// ---------------------------------------------------------------------------

import type { TransactionItem } from "@/types/cashier"

export interface ThermalReceiptData {
  storeName: string
  branch: string
  receiptNumber: number
  date: string
  cashier: string
  status: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  amountPaid: number
  change: number
}

export interface ThermalConnection {
  kind: "bluetooth" | "serial"
  name: string
  characteristic?: BluetoothRemoteGATTCharacteristic
  device?: BluetoothDevice
  writer?: WritableStreamDefaultWriter
  port?: SerialPort
}

const WIDTH = 32 // 58mm paper ≈ 32 monospace chars (font A)
const BAUD_RATE = 9600
// Known BLE services used by common thermal printers (PT-210 uses a vendor
// service, so `acceptAllDevices + scanning these` lets us find the writer).
const THERMAL_SERVICES = [0xffe0, 0xff00, 0xff02, 0x18f0, 0xfee7, 0xfe9f]

let connection: ThermalConnection | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

// ---------------------------------------------------------------------------
// Connection state helpers
// ---------------------------------------------------------------------------

export function isBluetoothSupported() {
  return typeof navigator !== "undefined" && "bluetooth" in navigator
}

export function isSerialSupported() {
  return typeof navigator !== "undefined" && "serial" in navigator
}

export function getConnection(): ThermalConnection | null {
  return connection
    ? { ...connection, device: undefined, port: undefined }
    : null
}

export function subscribeThermal(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export async function connectUsb() {
  if (!isSerialSupported())
    throw new Error("Web Serial is not supported in this browser")
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: BAUD_RATE })
  const writer = port.writable?.getWriter()
  connection = {
    kind: "serial",
    name: "USB thermal printer",
    writer,
    port,
  }
  port.addEventListener("disconnect", () => {
    connection = null
    emit()
  })
  emit()
  return connection
}

export async function connectBluetooth() {
  if (!isBluetoothSupported())
    throw new Error("Web Bluetooth is not supported in this browser")
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: THERMAL_SERVICES,
  })

  const characteristic = await findWritableCharacteristic(device)
  if (!characteristic) {
    throw new Error(
      "Hindi mahanap ang printable service ng printer (classic BT?). Use USB o ang PC print server."
    )
  }

  connection = {
    kind: "bluetooth",
    name: device.name || "Bluetooth thermal printer",
    characteristic,
    device,
  }
  device.addEventListener("gattserverdisconnected", () => {
    if (connection?.device === device) {
      connection = null
      emit()
    }
  })
  emit()
  return connection
}

async function findWritableCharacteristic(device: BluetoothDevice) {
  const server = await device.gatt?.connect()
  if (!server) return null

  const services = await server.getPrimaryServices()
  for (const service of services) {
    const characteristics = await service.getCharacteristics()
    for (const characteristic of characteristics) {
      const properties = characteristic.properties
      if (properties.write || properties.writeWithoutResponse) {
        return characteristic
      }
    }
  }
  return null
}

export async function disconnectThermal() {
  if (!connection) return
  const current = connection
  connection = null
  try {
    if (current.kind === "bluetooth") {
      if (current.characteristic)
        await current.characteristic.stopNotifications()
      current.device?.gatt?.disconnect()
    } else {
      current.writer?.releaseLock()
      current.port?.close()
    }
  } catch {
    // Ignore teardown errors
  }
  emit()
}

export async function printThermal(data: ThermalReceiptData) {
  if (!connection) throw new Error("No thermal printer connected")
  const bytes: Uint8Array<ArrayBuffer> = buildEscPos(data)
  if (connection.kind === "bluetooth" && connection.characteristic) {
    await writeBluetooth(connection.characteristic, bytes)
    return
  }
  if (connection.kind === "serial" && connection.writer) {
    await writeSerial(connection.writer, bytes)
    return
  }
  throw new Error("Thermal printer is not connected")
}

async function writeBluetooth(
  characteristic: BluetoothRemoteGATTCharacteristic,
  bytes: Uint8Array<ArrayBuffer>
) {
  if (characteristic.properties.writeWithoutResponse) {
    const chunkSize = 180 // safe BLE MTU
    for (let i = 0; i < bytes.length; i += chunkSize) {
      await characteristic.writeValueWithoutResponse(
        bytes.subarray(i, i + chunkSize)
      )
    }
  } else {
    await characteristic.writeValue(bytes)
  }
}

async function writeSerial(
  writer: WritableStreamDefaultWriter,
  bytes: Uint8Array<ArrayBuffer>
) {
  await writer.write(bytes)
  await writer.releaseLock()
}

// ---------------------------------------------------------------------------
// ESC/POS byte builder (58mm, 32 columns)
// ---------------------------------------------------------------------------

/** Normalize to the printer-safe ASCII set (₱ → P, strip other non-ASCII). */
export function toPrinterAscii(value: string) {
  return (value ?? "").replace(/\u20B1/g, "P").replace(/[^\x20-\x7E]/g, "")
}

function padCenter(text: string, width: number) {
  const clean = toPrinterAscii(text)
  const pad = Math.max(0, Math.floor((width - clean.length) / 2))
  return (
    " ".repeat(pad) +
    clean +
    " ".repeat(Math.max(0, width - clean.length - pad))
  )
}

/**
 * Build raw ESC/POS bytes for a 58mm receipt.
 * PT-210 has no cutter hardware, so we end with a paper feed instead of a cut.
 */
export function buildEscPos(
  data: ThermalReceiptData,
  width = WIDTH
): Uint8Array<ArrayBuffer> {
  const widthOf = (text: string) => toPrinterAscii(text).slice(0, width)

  const fmtMoney = (value: number, minWidth = 0) => {
    const raw = "P" + value.toFixed(2)
    return raw.padStart(Math.max(raw.length, minWidth))
  }

  const rightRow = (left: string, right: string) => {
    const avail = width - left.length
    return left + " ".repeat(Math.max(1, avail - right.length)) + right
  }

  const textLines: string[] = []
  textLines.push("")
  textLines.push(padCenter(data.storeName, width))
  textLines.push(padCenter(data.branch, width))
  textLines.push(padCenter("--- OFFICIAL RECEIPT ---", width))
  textLines.push("")
  textLines.push("=".repeat(width))
  textLines.push(
    "  Receipt No: BH-" + String(data.receiptNumber || 0).padStart(6, "0")
  )
  textLines.push("  Date:       " + widthOf(data.date))
  textLines.push("  Cashier:    " + widthOf(data.cashier))
  textLines.push("  Status:     " + widthOf(data.status).toUpperCase())
  textLines.push("-".repeat(width))

  const nameCol = 9
  const qtyCol = 3
  const priceCol = 7
  const totalCol = 8
  const headerRow =
    "  " +
    "ITEM".padEnd(nameCol) +
    " " +
    "QTY".padStart(qtyCol) +
    " " +
    "PRICE".padStart(priceCol) +
    " " +
    "TOTAL".padStart(totalCol)
  textLines.push(headerRow)
  textLines.push("-".repeat(width))
  for (const item of data.items || []) {
    const name = toPrinterAscii(item.name).slice(0, nameCol).padEnd(nameCol)
    const qty = String(item.qty || 0).padStart(qtyCol)
    const price = fmtMoney(item.price || 0, priceCol)
    const total = fmtMoney((item.qty || 0) * (item.price || 0), totalCol)
    textLines.push("  " + name + " " + qty + " " + price + " " + total)
  }
  textLines.push("-".repeat(width))
  textLines.push(rightRow("  SUB-TOTAL", fmtMoney(data.subtotal || 0)))
  if (data.discount > 0) {
    textLines.push(rightRow("  DISCOUNT", "-" + fmtMoney(data.discount || 0)))
  }
  textLines.push("=".repeat(width))
  textLines.push(
    padCenter("*** TOTAL: " + fmtMoney(data.total || 0) + " ***", width)
  )
  textLines.push("=".repeat(width))
  textLines.push(
    rightRow("  PAYMENT", widthOf(data.paymentMethod).toUpperCase())
  )
  textLines.push(rightRow("  AMOUNT PAID", fmtMoney(data.amountPaid || 0)))
  textLines.push(rightRow("  CHANGE", fmtMoney(data.change || 0)))
  textLines.push("")
  textLines.push(padCenter("Salamat po! Please keep this", width))
  textLines.push(padCenter("receipt for refund requests.", width))
  textLines.push("")
  textLines.push("")
  textLines.push("")

  // ESC @ init, ESC E emphasized for TOTAL, ESC d feed 6 (no cutter on PT-210)
  const parts: number[][] = [[0x1b, 0x40]]
  const lines = textLines.map((l) => toPrinterAscii(l).slice(0, width))
  lines.forEach((line) => {
    const isTotal = line.includes("*** TOTAL")
    const encoder = new TextEncoder()
    const bytes = Array.from(encoder.encode(line + "\n"))
    if (isTotal) {
      parts.push([0x1b, 0x45, 0x01])
      parts.push(bytes)
      parts.push([0x1b, 0x45, 0x00])
    } else {
      parts.push(bytes)
    }
  })
  parts.push([0x1b, 0x64, 0x06]) // feed 6 lines (no cutter on PT-210)

  const flattened: number[] = []
  for (const part of parts) flattened.push(...part)
  const result = new Uint8Array(new ArrayBuffer(flattened.length))
  for (let i = 0; i < flattened.length; i++) result[i] = flattened[i]
  return result
}

// ---------------------------------------------------------------------------
// Build a full printable receipt from a completed transaction
// ---------------------------------------------------------------------------

export function buildThermalReceipt(
  transaction: {
    receiptNumber: number
    items: TransactionItem[]
    subtotal: number
    discount: number
    total: number
    paymentMethod: string
    amountPaid: number
    change: number
    cashier: string
    status: string
  },
  storeName: string,
  branch: string,
  dateStr: string
): ThermalReceiptData {
  return {
    storeName,
    branch,
    receiptNumber: transaction.receiptNumber,
    date: dateStr,
    cashier: transaction.cashier,
    status: transaction.status,
    items: transaction.items,
    subtotal: transaction.subtotal,
    discount: transaction.discount,
    total: transaction.total,
    paymentMethod: transaction.paymentMethod,
    amountPaid: transaction.amountPaid,
    change: transaction.change,
  }
}
