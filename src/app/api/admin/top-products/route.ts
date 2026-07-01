import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getTopProducts } from "@/features/admin-dashboard/actions/get-top-products"
import type { AdminApiResponse, TopProductData } from "@/types/admin"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse<TopProductData[]>>> {
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

    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "10", 10), 1), 50)
    const data = await getTopProducts(limit)

    return NextResponse.json(
      { success: true, message: "Top products retrieved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin top products error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching top products" },
      { status: 500 }
    )
  }
}
