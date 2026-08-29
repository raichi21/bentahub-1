import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getMonitoringData } from "@/features/admin-dashboard/actions/get-monitoring"
import type { AdminApiResponse, MonitoringData } from "@/types/admin"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse<MonitoringData>>> {
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

    const branchId = request.nextUrl.searchParams.get("branchId") || undefined
    const dateFrom = request.nextUrl.searchParams.get("dateFrom") || undefined
    const dateTo = request.nextUrl.searchParams.get("dateTo") || undefined
    const data = await getMonitoringData(branchId, dateFrom, dateTo)

    return NextResponse.json(
      { success: true, message: "Monitoring data retrieved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin monitoring error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching monitoring data" },
      { status: 500 }
    )
  }
}
