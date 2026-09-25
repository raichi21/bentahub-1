import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react"
import { TableSearchInput } from "./table-search-input"

describe("TableSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("does not call onSearch on mount", () => {
    const onSearch = vi.fn()
    render(<TableSearchInput placeholder="Search..." onSearch={onSearch} />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it("debounces rapid typing into a single call with the final value", () => {
    const onSearch = vi.fn()
    render(<TableSearchInput placeholder="Search..." onSearch={onSearch} />)
    const input = screen.getByPlaceholderText("Search...")

    fireEvent.change(input, { target: { value: "a" } })
    fireEvent.change(input, { target: { value: "ab" } })
    fireEvent.change(input, { target: { value: "abc" } })
    expect(onSearch).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith("abc")
  })

  it("uses a custom debounce delay", () => {
    const onSearch = vi.fn()
    render(
      <TableSearchInput
        placeholder="Search..."
        onSearch={onSearch}
        debounceMs={500}
      />
    )
    fireEvent.change(screen.getByPlaceholderText("Search..."), {
      target: { value: "x" },
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearch).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onSearch).toHaveBeenCalledWith("x")
  })
})
