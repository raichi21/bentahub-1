import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, orders } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"

function checkAuth(token: string | null): {
  userId?: string
  error?: NextResponse
} {
  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      ),
    }
  }
  const payload = verifyToken(token)
  if (!payload) {
    return {
      error: NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      ),
    }
  }
  if (payload.role !== "admin") {
    return {
      error: NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      ),
    }
  }
  return { userId: payload.userId }
}

/**
 * DELETE /api/admin/users/[userId]/permanent
 *
 * Permanently removes a deactivated (archived) account. Blocked when:
 * - the target is the caller's own account,
 * - the target is the last remaining active admin,
 * - the target has any orders (orders.userId is ON DELETE CASCADE, so a
 *   hard delete would wipe sales history).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAuth(token)
    if (auth.error) return auth.error

    const { userId } = await params

    if (userId === auth.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot permanently delete your own account",
        },
        { status: 400 }
      )
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    if (existing.role === "admin") {
      const adminCount = await db
        .select({ n: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.isActive, true)))
      if (Number(adminCount[0]?.n ?? 0) <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot delete the last remaining active admin",
          },
          { status: 400 }
        )
      }
    }

    const orderRows = await db
      .select({ n: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId))
    const orderTotal = Number(orderRows[0]?.n ?? 0)
    if (orderTotal > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot permanently delete this user: ${orderTotal} order${orderTotal === 1 ? "" : "s"} on record would be destroyed`,
        },
        { status: 409 }
      )
    }

    // Hard delete. Dependent auth/cart/notification rows cascade; cash
    // drawer and transaction records are set to null and survive.
    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({
      success: true,
      message: "User permanently deleted",
    })
  } catch (error) {
    console.error("Admin permanent delete user error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    )
  }
}
