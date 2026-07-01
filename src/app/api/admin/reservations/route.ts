import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getReservations } from "@/features/admin-dashboard/actions/get-reservations"
import type { AdminApiResponse, ReservationApiData } from "@/types/admin"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse<ReservationApiData>>> {
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
    const branch = searchParams.get("branch") || undefined
    const status = searchParams.get("status") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getReservations({ branch, status, dateFrom, dateTo, search, page, pageSize })

    return NextResponse.json({
      success: true,
      message: "Reservations retrieved successfully",
      data,
    })
  } catch (error) {
    console.error("Admin reservations error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching reservations" },
      { status: 500 }
    )
  }
}
