import { describe, it, expect } from "vitest"
import { cn, formatOrderId, formatOrderTitle } from "./utils"

describe("formatOrderId", () => {
  it("formats a UUID into a short #TRN id", () => {
    expect(formatOrderId("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("#TRN-A1B2C3")
  })

  it("strips non-hex noise and uppercases the first 6 characters", () => {
    expect(formatOrderId("zz9xyz-0000-0000-0000-000000000000")).toBe("#TRN-ZZ9XYZ")
  })

  it("tolerates short ids", () => {
    expect(formatOrderId("ab")).toBe("#TRN-AB")
  })
})

describe("formatOrderTitle", () => {
  it("prefixes the formatted id with 'Order'", () => {
    expect(formatOrderTitle("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe("Order #TRN-A1B2C3")
  })
})

describe("cn", () => {
  it("merges class names and resolves tailwind conflicts", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
    expect(cn("text-red-500", false, null, undefined, "font-bold")).toBe("text-red-500 font-bold")
  })
})
