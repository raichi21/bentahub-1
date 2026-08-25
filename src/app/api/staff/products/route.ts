import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { getStaffProducts } from "@/features/staff-dashboard/actions/get-products"
import type { StaffApiResponse, StaffProductsData } from "@/types/staff"

export async function GET(request: NextRequest): Promise<NextResponse<StaffApiResponse<StaffProductsData>>> {
  try {
    // Shared branch-catalog read used by both the Staff dashboard and the
    // Cashier POS product grid.
    const auth = checkRoleAuth(extractToken(request), ["staff", "cashier"])

    if (auth.error) {
      return auth.error as NextResponse<StaffApiResponse<StaffProductsData>>
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      )
    }

    const branch = user.branch || "Lourdes Main Branch"

    const data = await getStaffProducts(branch)

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
