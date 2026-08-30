import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, branchInventory, inventoryBatches } from "@/servers/schemas"
import { eq, and, asc } from "drizzle-orm"

/**
 * GET /api/staff/batches?productId=<id>
 * Returns all inventory batches for a given product in the staff member's
 * branch, ordered by FIFO/FEFO priority (expiry ASC, received ASC, created ASC)
 * so the UI can show which batch sells next.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")
    if (auth.error) {
      return auth.error
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const productId = request.nextUrl.searchParams.get("productId")
    if (!productId) {
      return NextResponse.json({ success: false, message: "productId is required" }, { status: 400 })
    }

    const inv = await db.query.branchInventory.findFirst({
      where: and(
        eq(branchInventory.branchId, branchRecord.id),
        eq(branchInventory.productId, productId),
      ),
    })

    if (!inv) {
      return NextResponse.json({ success: true, message: "No inventory found", data: [] })
    }

    const batches = await db
      .select()
      .from(inventoryBatches)
      .where(eq(inventoryBatches.branchInventoryId, inv.id))
      .orderBy(
        asc(inventoryBatches.expiryDate),
        asc(inventoryBatches.receivedDate),
        asc(inventoryBatches.createdAt),
      )

    return NextResponse.json({
      success: true,
      message: "Batches retrieved successfully",
      data: batches,
    })
  } catch (error) {
    console.error("Staff batches error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching batches" },
      { status: 500 },
    )
  }
}
