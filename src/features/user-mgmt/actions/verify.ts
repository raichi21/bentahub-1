"use server"

import { z } from "zod"
import { db } from "@/servers/db"
import { users, emailVerifications } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"
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

/**
 * Server Action to verify a user's email using a 6-digit OTP code.
 */
export async function verifyEmailAction(payload: { email: string; code: string }): Promise<AuthResponse> {
  try {
    // 1. Zod input validation
    const parsed = verifyEmailSchema.safeParse(payload)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return { success: false, message: firstError }
    }

    const { email, code } = parsed.data

    // 2. Lookup the user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    if (user.isEmailVerified) {
      return { success: false, message: "Email is already verified" }
    }

    // 3. Find verification record
    const verification = await db.query.emailVerifications.findFirst({
      where: eq(emailVerifications.userId, user.id),
    })

    if (!verification) {
      return { success: false, message: "No verification request found. Please request a new code." }
    }

    // 4. Rate limiting: Check verification attempts
    const MAX_ATTEMPTS = 5
    if (verification.attempts >= MAX_ATTEMPTS) {
      return { success: false, message: "Too many incorrect attempts. Please request a new code." }
    }

    // Increment attempt count immediately to prevent brute-forcing
    await db
      .update(emailVerifications)
      .set({ attempts: verification.attempts + 1 })
      .where(eq(emailVerifications.id, verification.id))

    // 5. Expiry Check (5 minutes)
    if (new Date() > verification.expiresAt) {
      return { success: false, message: "Verification code has expired. Please request a new code." }
    }

    // 6. Compare hashed verification codes (SHA-256)
    const hashedInputCode = hashVerificationCode(code)
    if (hashedInputCode !== verification.code) {
      const remainingAttempts = MAX_ATTEMPTS - (verification.attempts + 1)
      if (remainingAttempts <= 0) {
        return { success: false, message: "Too many incorrect attempts. Please request a new code." }
      }
      return { 
        success: false, 
        message: `Invalid verification code. You have ${remainingAttempts} attempts remaining.` 
      }
    }

    // 7. Update User's verification status
    await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, user.id))

    // 8. Delete verification record
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.id, verification.id))

    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    }
  } catch (error) {
    console.error("❌ Email Verification Server Action Error:", error)
    return { success: false, message: "An unexpected error occurred during verification" }
  }
}

/**
 * Server Action to resend a verification email.
 * Includes a 60-second rate-limit cooldown check.
 */
export async function resendVerificationCodeAction(payload: { email: string }): Promise<AuthResponse> {
  try {
    // 1. Zod input validation
    const parsed = resendCodeSchema.safeParse(payload)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return { success: false, message: firstError }
    }

    const { email } = parsed.data

    // 2. Lookup user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    if (user.isEmailVerified) {
      return { success: false, message: "Email is already verified" }
    }

    // 3. Rate-limiting check: 60-second resend cooldown
    const existingCode = await db.query.emailVerifications.findFirst({
      where: eq(emailVerifications.userId, user.id),
    })

    if (existingCode) {
      const timePassedMs = Date.now() - new Date(existingCode.createdAt).getTime()
      const cooldownMs = 60 * 1000 // 60 seconds
      if (timePassedMs < cooldownMs) {
        const secondsRemaining = Math.ceil((cooldownMs - timePassedMs) / 1000)
        return {
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting another code.`,
        }
      }
    }

    // 4. Invalidate old codes (clean database)
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, user.id))

    // 5. Generate secure random OTP and hash it
    const newCode = generateVerificationCode()
    const hashedCode = hashVerificationCode(newCode)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

    await db.insert(emailVerifications).values({
      id: generateId(),
      userId: user.id,
      code: hashedCode,
      email,
      expiresAt,
      attempts: 0,
    })

    // 6. Send the verification email
    const emailSent = await sendVerificationEmail(email, newCode, user.fullName)

    if (!emailSent) {
      return { success: false, message: "Failed to send verification email. Please try again." }
    }

    return {
      success: true,
      message: "A new verification code has been sent to your email.",
    }
  } catch (error) {
    console.error("❌ Resend Code Server Action Error:", error)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
