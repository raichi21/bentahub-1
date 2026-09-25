import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { toCsvContent, downloadCsv } from "./export-csv"

describe("toCsvContent", () => {
  it("joins headers and rows with commas and newlines", () => {
    expect(
      toCsvContent(
        ["ID", "Branch", "Total"],
        [
          ["a1", "Main", 100],
          ["a2", "North", 25.5],
        ]
      )
    ).toBe("ID,Branch,Total\na1,Main,100\na2,North,25.5")
  })

  it("renders null and undefined cells as empty strings", () => {
    expect(toCsvContent(["A", "B"], [[null, undefined]])).toBe("A,B\n,")
  })

  it("handles zero rows (headers only)", () => {
    expect(toCsvContent(["A", "B"], [])).toBe("A,B")
  })
})

describe("downloadCsv", () => {
  let capturedBlob: Blob | null = null
  const createObjectURL = vi.fn((blob: Blob): string => {
    capturedBlob = blob
    return "blob:mock-url"
  })
  const revokeObjectURL = vi.fn()
  const realCreateElement = document.createElement.bind(document)
  let capturedAnchor: HTMLAnchorElement | null = null

  beforeEach(() => {
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
    capturedAnchor = null
    vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions
    ) => {
      const el = realCreateElement(tagName, options)
      if (tagName === "a") capturedAnchor = el as HTMLAnchorElement
      return el
    }) as typeof document.createElement)
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("downloads a blob with the CSV content under the given filename", async () => {
    downloadCsv("report-2026-01-01.csv", ["ID", "Total"], [["a1", 100]])

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(capturedBlob).not.toBeNull()
    const blob = capturedBlob as Blob
    expect(blob.type).toBe("text/csv")
    await expect(blob.text()).resolves.toBe("ID,Total\na1,100")
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
    expect(capturedAnchor?.download).toBe("report-2026-01-01.csv")
    expect(capturedAnchor?.href).toBe("blob:mock-url")
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
  })
})
