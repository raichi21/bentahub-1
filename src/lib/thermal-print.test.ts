import { describe, it, expect } from "vitest"
import {
  buildEscPos,
  buildThermalReceipt,
  toPrinterAscii,
  type ThermalReceiptData,
} from "./thermal-print"

const receipt: ThermalReceiptData = {
  storeName: "BentaHub",
  branch: "Main Branch, Metro Manila",
  receiptNumber: 42,
  date: "Sep 16, 2026, 8:30 PM",
  cashier: "Dave",
  status: "completed",
  items: [
    { productId: "p1", name: "Coca-Cola 1.5L", qty: 2, price: 75 },
    { productId: "p2", name: "Sky Flakes", qty: 1, price: 25 },
  ],
  subtotal: 175,
  discount: 10,
  total: 165,
  paymentMethod: "cash",
  amountPaid: 200,
  change: 35,
}

describe("toPrinterAscii", () => {
  it("maps the peso sign to P", () => {
    expect(toPrinterAscii("\u20B112.00")).toBe("P12.00")
  })

  it("strips non-ASCII characters", () => {
    expect(toPrinterAscii("Señor Shop — 100%")).toBe("Seor Shop  100%")
  })

  it("keeps printable ASCII intact", () => {
    expect(toPrinterAscii("Hello, World! 123")).toBe("Hello, World! 123")
  })

  it("tolerates null/undefined-ish input", () => {
    expect(toPrinterAscii("")).toBe("")
  })
})

describe("buildEscPos", () => {
  const bytes = buildEscPos(receipt)
  const text = new TextDecoder().decode(bytes)

  it("starts with ESC @ initialization", () => {
    expect([bytes[0], bytes[1]]).toEqual([0x1b, 0x40])
  })

  it("ends with a paper feed (ESC d 6) since PT-210 has no cutter", () => {
    const tail = bytes.slice(bytes.length - 3)
    expect(Array.from(tail)).toEqual([0x1b, 0x64, 0x06])
  })

  it("never emits a cut command", () => {
    expect(Array.from(bytes)).not.toContain(0x1d)
  })

  it("contains the store header fields", () => {
    expect(text).toContain("BentaHub")
    expect(text).toContain("Main Branch, Metro Manila")
    expect(text).toContain("BH-000042")
    expect(text).toContain("Dave")
  })

  it("lists every item with qty, price and total", () => {
    expect(text).toContain("Coca-Cola")
    expect(text).toContain("Sky Flake")
    expect(text).toContain("P150.00")
    expect(text).toContain("P25.00")
  })

  it("emphasizes (ESC E) exactly around the TOTAL line", () => {
    const arr = Array.from(bytes)
    let onIdx = -1
    let offIdx = -1
    for (let i = 0; i < arr.length - 2; i++) {
      if (arr[i] === 0x1b && arr[i + 1] === 0x45 && arr[i + 2] === 0x01)
        onIdx = i
      if (arr[i] === 0x1b && arr[i + 1] === 0x45 && arr[i + 2] === 0x00)
        offIdx = i
    }
    expect(onIdx).toBeGreaterThan(-1)
    expect(offIdx).toBeGreaterThan(onIdx)
    const inner = new TextDecoder().decode(bytes.slice(onIdx + 3, offIdx))
    expect(inner).toContain("*** TOTAL: P165.00 ***")
    // Only the TOTAL line should be emphasized
    expect(inner).not.toMatch(/PAYMENT|ITEM|SUB-TOTAL/)
  })

  it("keeps every printed line within 32 characters (58mm)", () => {
    const lines = text.split("\n")
    for (const line of lines) {
      // Strip ESC/POS escape sequences (control chars) to measure printed text only
      const printable = line
        .replace(/\x1b[^\n]{0,2}/g, "")
        .replace(/[\x00-\x1f]/g, "")
      expect(printable.length).toBeLessThanOrEqual(32)
    }
  })

  it("contains payment info", () => {
    expect(text).toContain("CASH")
    expect(text).toContain("P200.00")
    expect(text).toContain("P35.00")
  })
})

describe("buildThermalReceipt", () => {
  it("maps a transaction + store metadata into printable data", () => {
    const data = buildThermalReceipt(
      {
        receiptNumber: 7,
        items: receipt.items,
        subtotal: 175,
        discount: 0,
        total: 175,
        paymentMethod: "gcash",
        amountPaid: 175,
        change: 0,
        cashier: "Ana",
        status: "completed",
      },
      "Pamilya Store",
      "Angeles Branch",
      "Sep 16, 2026, 9:00 PM"
    )
    expect(data.storeName).toBe("Pamilya Store")
    expect(data.branch).toBe("Angeles Branch")
    expect(data.receiptNumber).toBe(7)
    expect(data.paymentMethod).toBe("gcash")
    expect(data.cashier).toBe("Ana")
  })
})
