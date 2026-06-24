import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/servers/db"
import { users, emailVerifications } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId, generateVerificationCode, hashVerificationCode } from "@/lib/auth-utils"
import { sendVerificationEmail } from "@/lib/email-service"
import type { AuthResponse } from "@/types/auth"

const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Verification code must be exactly 6 digits"),
})

const resendCodeSchema = z.object({
  email: z.string().email("Invalid email address"),
})

const MAX_VERIFICATION_ATTEMPTS = 5

/**
 * POST /api/auth/verify-email
 * Verifies a 6-digit OTP code against the database.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()

    // 1. Zod input validation
    const parsed = verifyEmailSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const { email, code } = parsed.data

    // 2. Lookup the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 400 }
      )
    }

    // 3. Find verification record
    const verification = await db.query.emailVerifications.findFirst({
      where: eq(emailVerifications.userId, user.id),
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, message: "No verification request found. Please request a new code." },
        { status: 400 }
      )
    }

    // 4. Rate-limiting verification attempts
    if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return NextResponse.json(
        { success: false, message: "Too many incorrect attempts. Please request a new code." },
        { status: 400 }
      )
    }

    // Increment attempt count immediately in the DB to mitigate brute-force
    await db
      .update(emailVerifications)
      .set({ attempts: verification.attempts + 1 })
      .where(eq(emailVerifications.id, verification.id))

    // 5. Expiry Check (5 minutes)
    if (new Date() > verification.expiresAt) {
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new code." },
        { status: 400 }
      )
    }

    // 6. Secure verification code comparison (SHA-256 hashes)
    const hashedInputCode = hashVerificationCode(code)
    if (hashedInputCode !== verification.code) {
      const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (verification.attempts + 1)
      if (remainingAttempts <= 0) {
        return NextResponse.json(
          { success: false, message: "Too many incorrect attempts. Please request a new code." },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid verification code. You have ${remainingAttempts} attempts remaining.` 
        },
        { status: 400 }
      )
    }

    // 7. Update user status to verified
    await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, user.id))

    // 8. Delete used verification record
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.id, verification.id))

    return NextResponse.json(
      { success: true, message: "Email verified successfully! You can now log in." },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Email Verification Handler Error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/verify-email
 * Resends verification code with 60-second cooldown rate-limiting.
 */
export async function PUT(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()

    // 1. Zod validation
    const parsed = resendCodeSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // 2. Lookup user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "Email already verified" },
        { status: 400 }
      )
    }

    // 3. Resend rate-limiting check (60-second cooldown)
    const existingCode = await db.query.emailVerifications.findFirst({
      where: eq(emailVerifications.userId, user.id),
    })

    if (existingCode) {
      const timePassedMs = Date.now() - new Date(existingCode.createdAt).getTime()
      const cooldownMs = 60 * 1000 // 60 seconds
      if (timePassedMs < cooldownMs) {
        const secondsRemaining = Math.ceil((cooldownMs - timePassedMs) / 1000)
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${secondsRemaining} seconds before requesting another code.`,
          },
          { status: 429 }
        )
      }
    }

    // 4. Invalidate old codes
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, user.id))

    // 5. Generate secure random OTP and save hashed
    const code = generateVerificationCode()
    const hashedCode = hashVerificationCode(code)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    await db.insert(emailVerifications).values({
      id: generateId(),
      userId: user.id,
      code: hashedCode,
      email,
      expiresAt,
      attempts: 0,
    })

    // 6. Send verification email
    const emailSent = await sendVerificationEmail(email, code, user.fullName)

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: "Failed to send verification email" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Verification code sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Resend Verification Handler Error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while resending verification code" },
      { status: 500 }
    )
  }
}
