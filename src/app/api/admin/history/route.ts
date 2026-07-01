import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getHistory } from "@/features/admin-dashboard/actions/get-history"

function checkAuth(token: string | null): { userId?: string; error?: NextResponse } {
  if (!token) {
    return { error: NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 }) }
  }
  const payload = verifyToken(token)
  if (!payload) {
    return { error: NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 }) }
  }
  if (payload.role !== "admin") {
    return { error: NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 }) }
  }
  return { userId: payload.userId }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAuth(token)
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
