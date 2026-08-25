import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/servers/db"
import { users, passwordResetTokens } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"
import { sendPasswordResetEmail } from "@/lib/email-service"
import type { AuthResponse } from "@/types/auth"

/** Reset token expiry in hours. */
const RESET_TOKEN_EXPIRY_HOURS = 1

/** Internal work-account domain — not a registered domain, mail sent here bounces. */
const INTERNAL_DOMAIN = "@bentahub.com"


/**
 * POST /api/auth/forgot-password
 *
 * Generates a password-reset token and emails a reset link.
 * Always returns the same message regardless of whether the email exists
 * to prevent user-enumeration attacks.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    // --- Lookup user (same response whether found or not) -------------------

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    // Security: identical response for existing and non-existing accounts
    const safeMessage = "If an account exists with this email, a password reset link will be sent"

    if (!user) {
      return NextResponse.json({ success: true, message: safeMessage }, { status: 200 })
    }

    if (user.email.toLowerCase().endsWith(INTERNAL_DOMAIN)) {
      return NextResponse.json({ success: true, message: safeMessage }, { status: 200 })
    }

    // --- Generate & store reset token ---------------------------------------

    // Delete any existing reset tokens for this user first
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    let resetToken = ""
    let isUnique = false
    let attemptsToGenerate = 0
    while (!isUnique && attemptsToGenerate < 10) {
      resetToken = crypto.randomInt(100000, 999999).toString()
      attemptsToGenerate++
      const existing = await db.query.passwordResetTokens.findFirst({
        where: eq(passwordResetTokens.token, resetToken),
      })
      if (!existing) {
        isUnique = true
      }
    }

    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    await db.insert(passwordResetTokens).values({
      id: generateId(),
      userId: user.id,
      token: resetToken,
      email: user.email,
      expiresAt,
    })

    // --- Send email (fail silently to avoid leaking account existence) ------

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    const emailSent = await sendPasswordResetEmail(user.email, resetToken, resetLink, user.fullName)

    if (!emailSent) {
      console.error("[Auth] Failed to send password reset email for user:", user.id)
    }

    return NextResponse.json({ success: true, message: safeMessage }, { status: 200 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during password reset request" },
      { status: 500 }
    )
  }
}
