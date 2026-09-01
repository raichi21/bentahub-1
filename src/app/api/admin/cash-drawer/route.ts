import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { getCashDrawerSessions } from "@/features/admin-dashboard/actions/get-cash-drawer"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const cashierId = searchParams.get("cashierId") || undefined
    const branchId = searchParams.get("branchId") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getCashDrawerSessions({ cashierId, branchId, dateFrom, dateTo, page, pageSize })

    return NextResponse.json({ success: true, message: "Cash drawer sessions retrieved successfully", data })
  } catch (error) {
    console.error("Admin get cash drawer error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
