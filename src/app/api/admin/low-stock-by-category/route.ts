import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getLowStockByCategory } from "@/features/admin-dashboard/actions/get-low-stock-by-category"
import type { AdminApiResponse, LowStockByCategoryData } from "@/types/admin"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse<LowStockByCategoryData[]>>> {
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

    const data = await getLowStockByCategory()

    return NextResponse.json(
      { success: true, message: "Low stock by category retrieved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin low stock by category error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching low stock by category" },
      { status: 500 }
    )
  }
}
