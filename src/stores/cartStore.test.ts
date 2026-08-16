import { describe, it, expect, beforeEach } from "vitest"
import { useCartStore, type CartItem } from "./cartStore"

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "item-1",
    productId: "prod-1",
    productName: "Rice",
    price: 10,
    quantity: 1,
    subtotal: 10,
    image: "",
    category: "Grains",
    branch: "Main Branch",
    addedAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  }
}

describe("cartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], itemCount: 0, total: 0, isLoading: false, error: null })
  })

  it("computes itemCount and total from items", () => {
    useCartStore.getState().setItems([
      makeItem({ id: "a", quantity: 2, subtotal: 20 }),
      makeItem({ id: "b", productId: "prod-2", quantity: 3, subtotal: 30 }),
    ])

    const state = useCartStore.getState()
    expect(state.itemCount).toBe(5)
    expect(state.total).toBe(50)
  })

  it("coerces string prices and subtotals to numbers", () => {
    useCartStore.getState().setItems([makeItem({ price: "10.5" as unknown as number, subtotal: "10.5" as unknown as number })])

    const state = useCartStore.getState()
    expect(state.items[0].price).toBe(10.5)
    expect(state.items[0].subtotal).toBe(10.5)
  })

  it("addItem merges by productId and recomputes totals", () => {
    const state = useCartStore.getState()
    state.addItem(makeItem())
    state.addItem(makeItem({ id: "server-id", quantity: 4, subtotal: 40 }))

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe("server-id")
    expect(items[0].quantity).toBe(4)
    expect(useCartStore.getState().itemCount).toBe(4)
    expect(useCartStore.getState().total).toBe(40)
  })

  it("updateItem recomputes subtotal from quantity when none is given", () => {
    useCartStore.getState().addItem(makeItem())

    useCartStore.getState().updateItem("item-1", { quantity: 3 })

    const item = useCartStore.getState().items[0]
    expect(item.quantity).toBe(3)
    expect(item.subtotal).toBe(30)
    expect(useCartStore.getState().total).toBe(30)
  })

  it("updateItem honors an explicit subtotal", () => {
    useCartStore.getState().addItem(makeItem())

    useCartStore.getState().updateItem("item-1", { quantity: 3, subtotal: 29.99 })

    expect(useCartStore.getState().items[0].subtotal).toBe(29.99)
    expect(useCartStore.getState().total).toBe(29.99)
  })

  it("removeItem drops the row and recomputes totals", () => {
    const state = useCartStore.getState()
    state.addItem(makeItem())
    state.addItem(makeItem({ id: "b", productId: "prod-2", quantity: 2, subtotal: 20 }))

    state.removeItem("item-1")

    const current = useCartStore.getState()
    expect(current.items).toHaveLength(1)
    expect(current.itemCount).toBe(2)
    expect(current.total).toBe(20)
  })

  it("clearCart resets items and totals", () => {
    const state = useCartStore.getState()
    state.addItem(makeItem())
    state.addItem(makeItem({ id: "b", productId: "prod-2", quantity: 2, subtotal: 20 }))

    state.clearCart()

    const current = useCartStore.getState()
    expect(current.items).toHaveLength(0)
    expect(current.itemCount).toBe(0)
    expect(current.total).toBe(0)
  })
})
