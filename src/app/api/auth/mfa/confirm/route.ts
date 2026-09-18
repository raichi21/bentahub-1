import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import {
  decryptMfaSecret,
  verifyTotp,
  generateBackupCodes,
  encryptBackupCodeStore,
} from "@/lib/mfa"
import { resolveMfaIdentity, issueSession } from "../_helpers"
import type { AuthResponse, MfaVerifyResponseData } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/mfa/confirm
 *
 * Confirms MFA enrollment by validating the first 6-digit code produced by
 * the newly added authenticator. On success: enables MFA, generates the
 * one-time backup codes, and — when this was part of a login (mfa challenge
 * token) — issues the full session JWT and returns the backup codes.
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<AuthResponse<MfaVerifyResponseData | { backupCodes: string[] }>>
> {
  try {
    const auth = resolveMfaIdentity<
      MfaVerifyResponseData | { backupCodes: string[] }
    >(request)
    if (auth.error) return auth.error

    const body = await request.json().catch(() => null)
    const code: unknown = body?.code

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Verification code is required" },
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

    if (user.mfaEnabled) {
      return NextResponse.json(
        { success: false, message: "MFA is already enabled for this account" },
        { status: 400 }
      )
    }

    if (!user.mfaSecret) {
      return NextResponse.json(
        { success: false, message: "Please start MFA setup first" },
        { status: 400 }
      )
    }

    const secret = decryptMfaSecret(user.mfaSecret)

    if (!verifyTotp(secret, code)) {
      return NextResponse.json(
        { success: false, message: "Invalid code. Please try again." },
        { status: 401 }
      )
    }

    const backupCodes = generateBackupCodes()

    await db
      .update(users)
      .set({
        mfaEnabled: true,
        mfaBackupCodes: encryptBackupCodeStore(backupCodes),
      })
      .where(eq(users.id, user.id))

    // Enrollments started during login upgrade the challenge into a full
    // session. Enrollments from settings just report success + backup codes.
    if (auth.identity.tokenType === "mfa") {
      return NextResponse.json(
        {
          success: true,
          message: "MFA enabled successfully",
          data: issueSession(
            {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
              phone: user.phone,
              image: user.image,
              branch: user.branch,
              isEmailVerified: user.isEmailVerified,
            },
            backupCodes
          ),
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "MFA enabled successfully",
        data: { backupCodes },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA confirm error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while enabling MFA" },
      { status: 500 }
    )
  }
}
