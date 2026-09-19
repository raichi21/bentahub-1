import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getSalesData } from "@/features/admin-dashboard/actions/get-sales"
import type { AdminApiResponse, SalesApiData } from "@/types/admin"

export async function GET(
  request: NextRequest
): Promise<NextResponse<AdminApiResponse<SalesApiData>>> {
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

    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getSalesData({
      branchId,
      dateFrom,
      dateTo,
      page,
      pageSize,
    })

    return NextResponse.json({
      success: true,
      message: "Sales data retrieved successfully",
      data,
    })
  } catch (error) {
    console.error("Admin sales error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while fetching sales data",
      },
      { status: 500 }
    )
  }
}
