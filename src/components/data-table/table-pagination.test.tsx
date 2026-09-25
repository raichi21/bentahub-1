import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { TablePagination } from "./table-pagination"

afterEach(() => {
  cleanup()
})

describe("TablePagination", () => {
  it("renders the Showing range and page indicator", () => {
    render(
      <TablePagination
        page={2}
        pageSize={15}
        totalCount={40}
        currentCount={15}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText("Showing 16 to 30 of 40 results")).toBeDefined()
    expect(screen.getByText("Page 2 of 3")).toBeDefined()
  })

  it("renders a zeroed footer when there is no data", () => {
    render(
      <TablePagination
        page={1}
        pageSize={15}
        totalCount={0}
        currentCount={0}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText("Showing 0 to 0 of 0 results")).toBeDefined()
    expect(screen.getByText("Page 1 of 1")).toBeDefined()
  })

  it("shows 0 as the start on an empty page and disables both buttons correctly", () => {
    render(
      <TablePagination
        page={3}
        pageSize={15}
        totalCount={40}
        currentCount={0}
        onPageChange={() => {}}
      />
    )
    expect(screen.getByText("Showing 0 to 40 of 40 results")).toBeDefined()
    expect(screen.getByText("Previous")).toBeDefined()
  })

  it("disables Previous on the first page and Next on the last page", () => {
    const { rerender } = render(
      <TablePagination
        page={1}
        pageSize={15}
        totalCount={40}
        currentCount={15}
        onPageChange={() => {}}
      />
    )
    expect((screen.getByText("Previous") as HTMLButtonElement).disabled).toBe(
      true
    )
    expect((screen.getByText("Next") as HTMLButtonElement).disabled).toBe(false)

    rerender(
      <TablePagination
        page={3}
        pageSize={15}
        totalCount={40}
        currentCount={10}
        onPageChange={() => {}}
      />
    )
    expect((screen.getByText("Next") as HTMLButtonElement).disabled).toBe(true)
  })

  it("calls onPageChange with the target page", () => {
    const onPageChange = vi.fn()
    render(
      <TablePagination
        page={2}
        pageSize={15}
        totalCount={40}
        currentCount={15}
        onPageChange={onPageChange}
      />
    )
    fireEvent.click(screen.getByText("Next"))
    expect(onPageChange).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByText("Previous"))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("renders a custom unit word", () => {
    render(
      <TablePagination
        page={1}
        pageSize={15}
        totalCount={20}
        currentCount={15}
        onPageChange={() => {}}
        unit="entries"
      />
    )
    expect(screen.getByText("Showing 1 to 15 of 20 entries")).toBeDefined()
  })

  it("renders the compact staff variant with identical math", () => {
    const { container } = render(
      <TablePagination
        page={2}
        pageSize={10}
        totalCount={25}
        currentCount={10}
        onPageChange={() => {}}
        unit="entries"
        variant="compact"
      />
    )
    expect(screen.getByText("Showing 11 to 20 of 25 entries")).toBeDefined()
    expect(screen.getByText("Page 2 of 3")).toBeDefined()
    const footer = container.firstChild as HTMLElement
    expect(footer.className).toContain("bg-muted/5")
  })
})
