import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { getSettings, saveSettings } from "@/features/settings/actions/get-settings"
import type { AdminApiResponse } from "@/types/admin"
import type { StoreSettingsData } from "@/features/settings/types"

export async function GET(request: NextRequest): Promise<NextResponse<AdminApiResponse<StoreSettingsData>>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      )
    }

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    const data = await getSettings()

    return NextResponse.json(
      { success: true, message: "Settings retrieved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin settings error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<AdminApiResponse<StoreSettingsData>>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      )
    }

    if (payload.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      )
    }

    const body = (await request.json()) as Partial<StoreSettingsData>
    const data = await saveSettings(body)

    return NextResponse.json(
      { success: true, message: "Settings saved successfully", data },
      { status: 200 }
    )
  } catch (error) {
    console.error("Admin settings save error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while saving settings" },
      { status: 500 }
    )
  }
}
