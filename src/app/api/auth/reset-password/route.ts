import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users, passwordResetTokens } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { hashPassword } from "@/lib/auth-utils"
import { PASSWORD_RULES } from "@/lib/password-validation"
import type { AuthResponse } from "@/types/auth"

/** Maximum number of reset attempts before the token is invalidated. */
const MAX_RESET_ATTEMPTS = 5

/**
 * POST /api/auth/reset-password
 *
 * Accepts a reset token (from the emailed link) and a new password.
 * Validates the token, updates the password, and marks the token as used.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()
    const { token, password } = body

    // --- Input validation ---------------------------------------------------

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      )
    }

    for (const rule of PASSWORD_RULES) {
      if (!rule.test(password)) {
        return NextResponse.json(
          {
            success: false,
            message: rule.label,
          },
          { status: 400 }
        )
      }
    }

    // --- Lookup reset token -------------------------------------------------

    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    })

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // --- Token validity checks ----------------------------------------------

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Reset token has expired" },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, message: "This reset token has already been used" },
        { status: 400 }
      )
    }

    if (resetToken.attempts >= MAX_RESET_ATTEMPTS) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please request a new reset link." },
        { status: 400 }
      )
    }

    // Increment attempt count on every try so brute-force is bounded
    await db
      .update(passwordResetTokens)
      .set({ attempts: resetToken.attempts + 1 })
      .where(eq(passwordResetTokens.id, resetToken.id))

    // --- Lookup user --------------------------------------------------------

    const user = await db.query.users.findFirst({
      where: eq(users.id, resetToken.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    // --- Update password & mark token as used -------------------------------

    const hashedPassword = await hashPassword(password)

    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id))

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during password reset" },
      { status: 500 }
    )
  }
}
