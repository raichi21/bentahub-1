import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { BranchSelect } from "./branch-select"

const OPTIONS = [
  { id: "b1", name: "Main Branch" },
  { id: "b2", name: "North Branch" },
]

describe("BranchSelect", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the all option plus one per branch", () => {
    render(<BranchSelect options={OPTIONS} value="" onChange={() => {}} />)
    expect(screen.getByText("All Branches")).toBeDefined()
    expect(screen.getByText("Main Branch")).toBeDefined()
    expect(screen.getByText("North Branch")).toBeDefined()
  })

  it("calls onChange with the selected option id", () => {
    const onChange = vi.fn()
    render(<BranchSelect options={OPTIONS} value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "b2" },
    })
    expect(onChange).toHaveBeenCalledWith("b2")
  })

  it("supports custom all value and label", () => {
    const onChange = vi.fn()
    render(
      <BranchSelect
        options={OPTIONS}
        value="all"
        onChange={onChange}
        allValue="all"
        allLabel="All Cashiers"
      />
    )
    expect(screen.getByText("All Cashiers")).toBeDefined()
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "all" },
    })
    expect(onChange).toHaveBeenCalledWith("all")
  })
})
