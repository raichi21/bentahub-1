import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { getStaffProducts } from "@/features/staff-dashboard/actions/get-products"
import type { StaffApiResponse, StaffProductsData } from "@/types/staff"

export async function GET(request: NextRequest): Promise<NextResponse<StaffApiResponse<StaffProductsData>>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      )
    }

    if (payload.role !== "staff" && payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Staff or admin access required" },
        { status: 403 },
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      )
    }

    if (!user.branch) {
      return NextResponse.json(
        { success: false, message: "No branch assigned to this user" },
        { status: 400 },
      )
    }

    const data = await getStaffProducts(user.branch)

    return NextResponse.json(
      { success: true, message: "Products retrieved successfully", data },
      { status: 200 },
    )
  } catch (error) {
    console.error("Staff products error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching products" },
      { status: 500 },
    )
  }
}
