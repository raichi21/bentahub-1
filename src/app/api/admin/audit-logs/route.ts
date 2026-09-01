import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { getAuditLogs } from "@/features/admin-dashboard/actions/get-audit-logs"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || undefined
    const severity = searchParams.get("severity") || undefined
    const search = searchParams.get("search") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getAuditLogs({
      category,
      severity,
      search,
      dateFrom,
      dateTo,
      page,
      pageSize,
    })

    return NextResponse.json({ success: true, message: "Audit logs retrieved successfully", data })
  } catch (error) {
    console.error("Admin get audit logs error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
