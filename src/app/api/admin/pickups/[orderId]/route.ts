import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"
import { confirmPickup } from "@/features/admin-dashboard/actions/confirm-pickup"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
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
