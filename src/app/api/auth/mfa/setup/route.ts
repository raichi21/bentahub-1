import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { sendMfaCode } from "@/lib/mfa-email"
import { maskEmail } from "@/lib/mfa"
import { resolveMfaIdentity } from "../_helpers"
import type { AuthResponse, MfaCodeSentData } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/mfa/setup
 *
 * Emails a fresh 6-digit sign-in code to the account's address. Used for MFA
 * verification (login), first-time enrollment, and enabling MFA from
 * settings. The caller is identified by either a full session token or an
 * MFA challenge token.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<MfaCodeSentData>>> {
  try {
    const auth = resolveMfaIdentity<MfaCodeSentData>(request)
    if (auth.error) return auth.error

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.identity.userId),
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account not found or deactivated" },
        { status: 401 }
      )
    }

    const delivered = await sendMfaCode(user)
    if (!delivered) {
      return NextResponse.json(
        {
          success: false,
          message: "We couldn't email a verification code. Please try again.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "A verification code was sent to your email",
        data: { email: maskEmail(user.email) },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA setup error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while sending the code" },
      { status: 500 }
    )
  }
}
