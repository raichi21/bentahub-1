import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { resolveMfaIdentity } from "../_helpers"
import type { AuthResponse, MfaStatusData } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/auth/mfa/status
 *
 * Returns whether the signed-in user has MFA enabled. Used by the MFA
 * management panel in settings/profile.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<AuthResponse<MfaStatusData>>> {
  try {
    const auth = resolveMfaIdentity<MfaStatusData>(request)
    if (auth.error) return auth.error

    if (auth.identity.tokenType !== "full") {
      return NextResponse.json(
        { success: false, message: "A full session is required" },
        { status: 403 }
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.identity.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "MFA status retrieved",
        data: { enabled: user.mfaEnabled },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA status error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while fetching MFA status",
      },
      { status: 500 }
    )
  }
}
