import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import {
  generateMfaSecret,
  buildOtpauthUrl,
  generateQrCodeDataUrl,
  encryptMfaSecret,
  isMfaEnforced,
} from "@/lib/mfa"
import { resolveMfaIdentity } from "../_helpers"
import type { AuthResponse, MfaSetupData } from "@/types/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/mfa/setup
 *
 * Begins MFA enrollment: generates a fresh TOTP secret, persists it in a
 * pending (not yet enabled) state, and returns the QR code + manual secret
 * so the user can add the authenticator. The authenticated caller is
 * identified by either a full session token (settings) or an MFA challenge
 * token (forced enrollment during login).
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<MfaSetupData>>> {
  try {
    const auth = resolveMfaIdentity<MfaSetupData>(request)
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

    if (user.mfaEnabled) {
      return NextResponse.json(
        { success: false, message: "MFA is already enabled for this account" },
        { status: 400 }
      )
    }

    const secret = generateMfaSecret()
    await db
      .update(users)
      .set({ mfaSecret: encryptMfaSecret(secret) })
      .where(eq(users.id, user.id))

    const identifier = user.email || user.fullName || user.phone || user.id
    const otpauthUrl = buildOtpauthUrl(secret, identifier)
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpauthUrl)

    return NextResponse.json(
      {
        success: true,
        message: isMfaEnforced()
          ? "Set up your authenticator to continue"
          : "Authenticator setup ready",
        data: { otpauthUrl, qrCodeDataUrl, manualSecret: secret },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA setup error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while starting MFA setup" },
      { status: 500 }
    )
  }
}
