import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { getTransactions } from "@/features/staff-dashboard/actions/get-transactions"
import type { StaffApiResponse, StaffTransactionItem } from "@/types/staff"

export async function GET(request: NextRequest): Promise<NextResponse<StaffApiResponse<StaffTransactionItem[]>>> {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")

    if (auth.error) {
      return auth.error as NextResponse<StaffApiResponse<StaffTransactionItem[]>>
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
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
