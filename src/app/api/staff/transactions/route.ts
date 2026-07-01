import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { getTransactions } from "@/features/staff-dashboard/actions/get-transactions"
import type { StaffApiResponse, StaffTransactionItem } from "@/types/staff"

export async function GET(request: NextRequest): Promise<NextResponse<StaffApiResponse<StaffTransactionItem[]>>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      )
    }

    const branch = user.branch || "Lourdes Main Branch"

    const data = await getTransactions(branch)

    return NextResponse.json(
      { success: true, message: "Transactions retrieved successfully", data },
      { status: 200 },
    )
  } catch (error) {
    console.error("Staff transactions error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching transactions" },
      { status: 500 },
    )
  }
}
