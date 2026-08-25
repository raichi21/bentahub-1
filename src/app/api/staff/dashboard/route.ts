import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { getStaffDashboard } from "@/features/staff-dashboard/actions/get-dashboard"
import type { StaffApiResponse, StaffDashboardData } from "@/types/staff"

export async function GET(request: NextRequest): Promise<NextResponse<StaffApiResponse<StaffDashboardData>>> {
  try {
    const auth = checkRoleAuth(extractToken(request), ["staff"], "Staff area")

    if (auth.error) {
      return auth.error as NextResponse<StaffApiResponse<StaffDashboardData>>
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

    const data = await getStaffDashboard(branch)

    return NextResponse.json(
      { success: true, message: "Dashboard data retrieved successfully", data },
      { status: 200 },
    )
  } catch (error) {
    console.error("Staff dashboard error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching dashboard data" },
      { status: 500 },
    )
  }
}
