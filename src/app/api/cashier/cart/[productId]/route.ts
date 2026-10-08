import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuthActive } from "@/lib/auth-utils"
import {
  setCashierCartQuantity,
  removeCashierCartItem,
} from "@/features/cashier-dashboard/actions/cashier-cart"

async function resolveCashier(request: NextRequest) {
  const auth = await checkRoleAuthActive(
    extractToken(request),
    ["cashier"],
    "Cashier area"
  )
  if (auth.error) return { error: auth.error }

  // checkRoleAuthActive already looked the user up — reuse it instead of
  // querying `users` a second time (one fewer paid DB round-trip).
  return {
    userId: auth.userId,
    branchName: auth.user.branch || "Lourdes Main Branch",
  }
}

/**
 * PATCH /api/cashier/cart/[productId]
 * Set an exact quantity for a line. Body: { quantity: number }
 * Quantity is clamped to the branch stock; <= 0 removes the line.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const current = await resolveCashier(request)
    if (current.error) return current.error

    const { productId } = await params

    const body = await request.json()
    const quantity = Number(body?.quantity)

    const setResult = await setCashierCartQuantity(
      current.userId,
      productId,
      current.branchName,
      quantity
    )

    if (!setResult.ok) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      )
    }

    // Other devices learn about the change via Supabase Realtime (WAL-driven).

    return NextResponse.json(
      { success: true, message: "Cart updated", data: setResult.data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cashier cart PATCH error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update cart" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cashier/cart/[productId]
 * Remove a single line from the cart.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const current = await resolveCashier(request)
    if (current.error) return current.error

    const { productId } = await params

    await removeCashierCartItem(current.userId, productId)

    // Other devices learn about the change via Supabase Realtime (WAL-driven).
    return NextResponse.json(
      { success: true, message: "Item removed from cart" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cashier cart DELETE error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to remove item from cart" },
      { status: 500 }
    )
  }
}
