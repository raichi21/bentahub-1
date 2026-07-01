import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { getHistory } from "@/features/admin-dashboard/actions/get-history"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const branchId = searchParams.get("branchId") || undefined
    const method = searchParams.get("method") || undefined
    const status = searchParams.get("status") || undefined
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getHistory({ dateFrom, dateTo, branchId, method, status, search, page, pageSize })

    return NextResponse.json({ success: true, message: "History retrieved successfully", data })
  } catch (error) {
    console.error("Admin get history error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
