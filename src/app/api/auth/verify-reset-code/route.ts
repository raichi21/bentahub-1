import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { passwordResetTokens } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"
import type { AuthResponse } from "@/types/auth"

/** Maximum number of reset attempts before the code is invalidated. */
const MAX_RESET_ATTEMPTS = 5

/**
 * POST /api/auth/verify-reset-code
 *
 * Accepts email and the 6-digit code.
 * Validates the code, checks for expiry/attempts, and increments the attempts counter.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()
    const { email, token } = body

    // --- Input validation ---------------------------------------------------

    if (!email || !token) {
      return NextResponse.json(
        { success: false, message: "Email and verification code are required" },
        { status: 400 }
      )
    }

    // --- Lookup reset token -------------------------------------------------

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.email, email)
      ),
    })

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      )
    }

    // --- Token validity checks ----------------------------------------------

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired" },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          message: "This verification code has already been used",
        },
        { status: 400 }
      )
    }

    if (resetToken.attempts >= MAX_RESET_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please request a new code.",
        },
        { status: 400 }
      )
    }

    // Increment attempt count on every try so brute-force is bounded
    await db
      .update(passwordResetTokens)
      .set({ attempts: resetToken.attempts + 1 })
      .where(eq(passwordResetTokens.id, resetToken.id))

    return NextResponse.json(
      { success: true, message: "Code verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify reset code error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    )
  }
}
