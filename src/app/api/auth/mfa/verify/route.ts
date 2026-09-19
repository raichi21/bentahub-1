import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { checkMfaCode } from "@/lib/mfa-email"
import {
  resolveMfaChallengeToken,
  resolveMfaIdentity,
  issueSession,
} from "../_helpers"
import type { AuthResponse, MfaVerifyResponseData } from "@/types/auth"

type VerifyData = MfaVerifyResponseData | { enabled: boolean }

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function codeError<T>(
  message: string,
  status: number
): NextResponse<AuthResponse<T>> {
  return NextResponse.json({ success: false, message }, { status })
}

/**
 * POST /api/auth/mfa/verify
 *
 * Validates the 6-digit code emailed to the user.
 *
 * - With an `mfaToken` (login flow, from the password or OAuth step): a valid
 *   code completes the sign-in and issues the full session JWT. Users whose
 *   MFA was not yet enabled are auto-enrolled on first successful verify.
 * - With a full session token (settings): a valid code simply enables MFA for
 *   the signed-in user.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<VerifyData>>> {
  try {
    const body = await request.json().catch(() => null)
    const mfaToken: unknown = body?.mfaToken
    const code: unknown = body?.code

    if (typeof code !== "string" || !code.trim()) {
      return codeError<VerifyData>("Verification code is required", 400)
    }

    // Resolve who is acting: the MFA challenge token (login) or a full
    // session token (settings panel).
    let identity: { userId: string; tokenType: "mfa" | "full" }
    if (typeof mfaToken === "string" && mfaToken) {
      const challenge = resolveMfaChallengeToken<VerifyData>(mfaToken)
      if (challenge.error) return challenge.error
      identity = challenge.identity
    } else {
      const auth = resolveMfaIdentity<VerifyData>(request)
      if (auth.error) return auth.error
      if (auth.identity.tokenType !== "full") {
        return codeError<VerifyData>("A full session is required", 403)
      }
      identity = auth.identity
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, identity.userId),
    })

    if (!user || !user.isActive) {
      return codeError<VerifyData>("Account not found or deactivated", 401)
    }

    const check = await checkMfaCode(user.id, code)

    switch (check.status) {
      case "missing":
        return codeError<VerifyData>(
          "No verification code was found. Please request a new code.",
          400
        )
      case "expired":
        return codeError<VerifyData>(
          "Verification code has expired. Please request a new one.",
          400
        )
      case "locked":
        return codeError<VerifyData>(
          "Too many incorrect attempts. Please request a new code.",
          429
        )
      case "invalid":
        return codeError<VerifyData>(
          `Invalid verification code. You have ${check.attemptsLeft} attempt${
            check.attemptsLeft === 1 ? "" : "s"
          } remaining.`,
          401
        )
    }

    // Auto-enroll on first successful verification (enforcement flow).
    if (!user.mfaEnabled) {
      await db
        .update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, user.id))
    }

    // Login flow: upgrade the challenge into a full session.
    if (identity.tokenType === "mfa") {
      return NextResponse.json(
        {
          success: true,
          message: "Verification successful",
          data: issueSession(user),
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "MFA enabled successfully",
        data: { enabled: true },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("MFA verify error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    )
  }
}
