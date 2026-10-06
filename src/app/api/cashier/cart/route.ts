import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuthActive } from "@/lib/auth-utils"
import {
  getCashierCart,
  addCashierCartItem,
  clearCashierCart,
  toCartData,
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

const ADD_ERRORS: Record<
  "product-not-found" | "not-available" | "out-of-stock",
  { message: string; status: number }
> = {
  "product-not-found": { message: "Product not found", status: 404 },
  "not-available": { message: "Product is not available", status: 404 },
  "out-of-stock": { message: "Product is out of stock", status: 400 },
}

/**
 * GET /api/cashier/cart
 * Current sale cart for the authenticated cashier. Polled by every connected
 * cashier device so a scan made on one shows up on the register.
 */
export async function GET(request: NextRequest) {
  try {
    const current = await resolveCashier(request)
    if (current.error) return current.error

    const items = await getCashierCart(current.userId, current.branchName)
    return NextResponse.json(
      { success: true, data: toCartData(items) },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cashier cart GET error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch cart" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cashier/cart
 * Add one unit of a product. Body: { productId: string }
 * Server-side stock validation + atomic increment on (user_id, product_id).
 */
export async function POST(request: NextRequest) {
  try {
    const current = await resolveCashier(request)
    if (current.error) return current.error

    const body = await request.json()
    const { productId } = body

    const addResult = await addCashierCartItem(
      current.userId,
      productId,
      current.branchName
    )

    if (!addResult.ok) {
      const detail = ADD_ERRORS[addResult.reason]
      return NextResponse.json(
        { success: false, message: detail.message },
        { status: detail.status }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Item added to cart",
        data: addResult.data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cashier cart POST error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to add item to cart" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cashier/cart
 * Clear the entire cart (CANCEL ORDER, or right after a completed sale).
 */
export async function DELETE(request: NextRequest) {
  try {
    const current = await resolveCashier(request)
    if (current.error) return current.error

    await clearCashierCart(current.userId)
    return NextResponse.json(
      { success: true, message: "Cart cleared" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Cashier cart DELETE error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to clear cart" },
      { status: 500 }
    )
  }
}
