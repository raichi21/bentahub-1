"use server"

import { z } from "zod"
import { db } from "@/servers/db"
import { users, emailVerifications } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId, generateVerificationCode, hashPassword, hashVerificationCode } from "@/lib/auth-utils"
import { sendVerificationEmail } from "@/lib/email-service"
import type { AuthResponse, RegisterPayload } from "@/types/auth"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    // 1. Zod input validation
    const parsed = registerSchema.safeParse(payload)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return {
        success: false,
        message: firstError,
      }
    }

    const { email, password, fullName } = parsed.data

    // 2. Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // If user registered before but didn't verify, we reuse their user record
        // Invalidate old verification codes
        await db.delete(emailVerifications).where(eq(emailVerifications.userId, existingUser.id))

        // Create new verification code
        const verificationCode = generateVerificationCode()
        const hashedCode = hashVerificationCode(verificationCode)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration

        await db.insert(emailVerifications).values({
          id: generateId(),
          userId: existingUser.id,
          code: hashedCode,
          email: existingUser.email,
          expiresAt,
          attempts: 0,
        })

        // Send verification email
        await sendVerificationEmail(existingUser.email, verificationCode, existingUser.fullName)

        return {
          success: true,
          message: "Account already exists but is unverified. A new verification code has been sent to your email.",
          data: {
            userId: existingUser.id,
            email: existingUser.email,
            requiresEmailVerification: true,
          },
        }
      }

      return {
        success: false,
        message: "Email already registered and verified. Please sign in.",
      }
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password)

    // 4. Create user
    const userId = generateId()
    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      fullName,
      role: "customer",
      isEmailVerified: false,
    })

    // 5. Generate and store verification code (expires in 5 minutes)
    const verificationCode = generateVerificationCode()
    const hashedCode = hashVerificationCode(verificationCode)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await db.insert(emailVerifications).values({
      id: generateId(),
      userId,
      code: hashedCode,
      email,
      expiresAt,
      attempts: 0,
    })

    // 6. Send verification email (non-blocking so user is registered)
    const emailSent = await sendVerificationEmail(email, verificationCode, fullName)

    return {
      success: true,
      message: emailSent
        ? "Registration successful. Please check your email for the verification code."
        : "Account created! We couldn't send the verification email right now. You can request a new code from the login page.",
      data: {
        userId,
        email,
        requiresEmailVerification: true,
      },
    }
  } catch (error) {
    console.error("❌ Registration Server Action Error:", error)
    return {
      success: false,
      message: "An unexpected error occurred during registration",
    }
  }
}
