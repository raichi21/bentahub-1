import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { getPickups } from "@/features/admin-dashboard/actions/get-pickups"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined
    const branch = searchParams.get("branch") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getPickups({ status, search, branch, dateFrom, dateTo, page, pageSize })

    return NextResponse.json({ success: true, message: "Pickups retrieved successfully", data })
  } catch (error) {
    console.error("Admin get pickups error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
