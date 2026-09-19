import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getAdminOverview } from "@/features/admin-dashboard/actions/get-overview"
import type { AdminApiResponse, AdminOverviewData } from "@/types/admin"

export async function GET(
  request: NextRequest
): Promise<NextResponse<AdminApiResponse<AdminOverviewData>>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      )
    }

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    const data = await getAdminOverview()

    return NextResponse.json(
      { success: true, message: "Overview data retrieved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin overview error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while fetching overview data",
      },
      { status: 500 }
    )
  }
}
