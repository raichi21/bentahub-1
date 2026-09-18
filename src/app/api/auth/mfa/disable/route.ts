import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { decryptMfaSecret, verifyTotp } from "@/lib/mfa"
import { resolveMfaIdentity } from "../_helpers"
import type { AuthResponse } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/mfa/disable
 *
 * Turns off MFA for the signed-in user. The current authenticator code must
 * be provided to prove possession of the enrolled device, preventing a
 * stolen session from silently removing protection.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const auth = resolveMfaIdentity<unknown>(request)
    if (auth.error) return auth.error

    if (auth.identity.tokenType !== "full") {
      return NextResponse.json(
        { success: false, message: "A full session is required" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    const code: unknown = body?.code

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Current verification code is required" },
        { status: 400 }
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.identity.userId),
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account not found or deactivated" },
        { status: 401 }
      )
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { success: false, message: "MFA is not enabled for this account" },
        { status: 400 }
      )
    }

    const secret = decryptMfaSecret(user.mfaSecret)

    if (!verifyTotp(secret, code)) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 401 }
      )
    }

    await db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: null })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      { success: true, message: "MFA disabled successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA disable error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while disabling MFA" },
      { status: 500 }
    )
  }
}
