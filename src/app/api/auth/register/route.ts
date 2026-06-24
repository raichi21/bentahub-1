import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/servers/db"
import { users, emailVerifications } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId, generateVerificationCode, hashPassword, hashVerificationCode } from "@/lib/auth-utils"
import { sendVerificationEmail } from "@/lib/email-service"
import type { AuthResponse } from "@/types/auth"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

/**
 * POST /api/auth/register
 * Creates a new customer account, saves a secure hashed 6-digit OTP code to PostgreSQL,
 * and sends it via the configured nodemailer transporter.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body = await request.json()

    // 1. Zod validation
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const { email, password, fullName } = parsed.data

    // 2. Check if email already registered
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Recycle unverified account by invalidating previous OTPs
        await db.delete(emailVerifications).where(eq(emailVerifications.userId, existingUser.id))

        // Create new OTP
        const verificationCode = generateVerificationCode()
        const hashedCode = hashVerificationCode(verificationCode)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry

        await db.insert(emailVerifications).values({
          id: generateId(),
          userId: existingUser.id,
          code: hashedCode,
          email: existingUser.email,
          expiresAt,
          attempts: 0,
        })

        await sendVerificationEmail(existingUser.email, verificationCode, existingUser.fullName)

        return NextResponse.json(
          {
            success: true,
            message: "Account already exists but is unverified. A new verification code has been sent.",
            data: {
              userId: existingUser.id,
              email: existingUser.email,
              requiresEmailVerification: true,
            },
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        { success: false, message: "Email already registered and verified." },
        { status: 409 }
      )
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(password)
    const userId = generateId()

    // 4. Insert user
    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      fullName,
      role: "customer",
      isEmailVerified: false,
    })

    // 5. Generate and store OTP code (expires in 5 minutes)
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

    // 6. Send verification email (non-blocking)
    const emailSent = await sendVerificationEmail(email, verificationCode, fullName)

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? "Registration successful. Please check your email for the verification code."
          : "Account created! We couldn't send the verification email right now. You can request a new code from the login page.",
        data: {
          userId,
          email,
          requiresEmailVerification: true,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ Registration API Route Handler Error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during registration" },
      { status: 500 }
    )
  }
}
