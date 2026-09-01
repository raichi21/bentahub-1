import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { getCashDrawerTransactions } from "@/features/admin-dashboard/actions/get-cash-drawer-detail"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { sessionId } = await context.params

    const data = await getCashDrawerTransactions(sessionId)
    if (!data) {
      return NextResponse.json({ success: false, message: "Cash drawer session not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Cash drawer transactions retrieved successfully", data })
  } catch (error) {
    console.error("Admin get cash drawer detail error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
