import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { confirmPickup } from "@/features/admin-dashboard/actions/confirm-pickup"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAuth(token)
    if (auth.error) return auth.error

    const { orderId } = await params
    const result = await confirmPickup(orderId)

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message })
    }
    return NextResponse.json({ success: false, message: result.message }, { status: 400 })
  } catch (error) {
    console.error("Admin confirm pickup error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
