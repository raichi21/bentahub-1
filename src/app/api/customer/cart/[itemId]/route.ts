import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { cartItems } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"
import { extractToken, verifyToken } from "@/lib/auth-utils"

async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const token = extractToken(request)

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  return decoded.userId
}

/**
 * PUT /api/customer/cart/[itemId]
 * Update cart item quantity
 * Body: { quantity: number }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = await params
    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined || quantity < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      )
    }

    // Ownership is enforced by the WHERE clause itself: only the user's own
    // row can be updated. No separate pre-SELECT needed — one query total.
    const updated = await db
      .update(cartItems)
      .set({
        quantity,
        subtotal: sql`(${cartItems.price} * ${quantity})::numeric(10, 2)`,
      })
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        )
      )
      .returning()

    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item updated",
        data: updated[0],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating cart item:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update cart item" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/customer/cart/[itemId]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = await params

    // Ownership is enforced by the WHERE clause itself: only the user's own
    // row can be deleted. No separate pre-SELECT needed — one query total.
    const deleted = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, itemId),
          eq(cartItems.userId, userId)
        )
      )
      .returning({ id: cartItems.id })

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cart item removed",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting cart item:", error)
    return NextResponse.json(
      { success: false, message: "Failed to remove cart item" },
      { status: 500 }
    )
  }
}
