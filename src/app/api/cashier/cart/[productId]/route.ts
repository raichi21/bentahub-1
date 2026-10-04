import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuthActive } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
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

  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
  })
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      ),
    }
  }

  return {
    userId: auth.userId,
    branchName: user.branch || "Lourdes Main Branch",
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
