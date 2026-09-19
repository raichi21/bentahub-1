import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { maskEmail } from "@/lib/mfa"
import { sendMfaCode, checkMfaCode } from "@/lib/mfa-email"
import { resolveMfaIdentity } from "../_helpers"
import type { AuthResponse, MfaCodeSentData } from "@/types/auth"

type DisableData = MfaCodeSentData | { disabled: boolean }

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function error<T>(
  message: string,
  status: number
): NextResponse<AuthResponse<T>> {
  return NextResponse.json({ success: false, message }, { status })
}

/**
 * POST /api/auth/mfa/disable
 *
 * Turns off MFA for the signed-in user. Two-phase:
 * - Call 1 (no `code`): emails a fresh verification code to the account.
 * - Call 2 (with `code`): validates the code, then disables MFA. Requiring a
 *   fresh emailed code proves mailbox possession before removing protection.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<DisableData>>> {
  try {
    const auth = resolveMfaIdentity<DisableData>(request)
    if (auth.error) return auth.error

    if (auth.identity.tokenType !== "full") {
      return error<DisableData>("A full session is required", 403)
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.identity.userId),
    })

    if (!user || !user.isActive) {
      return error<DisableData>("Account not found or deactivated", 401)
    }

    if (!user.mfaEnabled) {
      return error<DisableData>("MFA is not enabled for this account", 400)
    }

    const body = await request.json().catch(() => null)
    const code: unknown = body?.code

    // Phase 1: send the verification code.
    if (typeof code !== "string" || !code.trim()) {
      const delivered = await sendMfaCode(user)
      if (!delivered) {
        return error<DisableData>(
          "We couldn't email a verification code. Please try again.",
          500
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
    }

    // Phase 2: verify the code, then disable.
    const check = await checkMfaCode(user.id, code)

    switch (check.status) {
      case "missing":
        return error<DisableData>(
          "No verification code was found. Please request a new code.",
          400
        )
      case "expired":
        return error<DisableData>(
          "Verification code has expired. Please request a new one.",
          400
        )
      case "locked":
        return error<DisableData>(
          "Too many incorrect attempts. Please request a new code.",
          429
        )
      case "invalid":
        return error<DisableData>(
          `Invalid verification code. You have ${check.attemptsLeft} attempt${
            check.attemptsLeft === 1 ? "" : "s"
          } remaining.`,
          401
        )
    }

    await db
      .update(users)
      .set({ mfaEnabled: false })
      .where(eq(users.id, user.id))

    return NextResponse.json(
      {
        success: true,
        message: "MFA disabled successfully",
        data: { disabled: true },
      },
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
