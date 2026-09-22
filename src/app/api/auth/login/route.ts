import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users, storeSettings } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import {
  verifyPassword,
  generateToken,
  generateMfaToken,
} from "@/lib/auth-utils"
import { isMfaEnforced, mfaAppliesToRole } from "@/lib/mfa"
import type {
  AuthResponse,
  LoginResponseData,
  LoginChallengeData,
} from "@/types/auth"

/**
 * Whether MFA enforcement is active: production builds enforce it unless the
 * admin has explicitly switched it off in Admin Settings (store_settings).
 * Missing row / null flag preserves the previous default (enforced).
 */
async function isMfaRequiredGlobally(): Promise<boolean> {
  if (!isMfaEnforced()) return false
  try {
    const s = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.id, "default"),
    })
    return s?.mfaRequired ?? true
  } catch {
    return true
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * On success, returns the JWT token and user data in the response body.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AuthResponse<LoginResponseData | LoginChallengeData>>> {
  try {
    const body = await request.json()
    const { email, password } = body

    // --- Input validation ---------------------------------------------------

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      )
    }

    // --- Lookup user --------------------------------------------------------

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // --- Account active gate -------------------------------------------------

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated. Please contact the administrator.",
        },
        { status: 403 }
      )
    }

    // --- Email verification gate (enforced in production) -------------------

    if (!user.isEmailVerified && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Please verify your email first" },
        { status: 403 }
      )
    }

    // --- Password check -----------------------------------------------------

    // Users created via social login have no password set; they must sign in
    // with their OAuth provider instead of email + password.
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account uses a social sign-in. Please use the Google or Facebook button to log in.",
        },
        { status: 401 }
      )
    }

    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // --- MFA gate ----------------------------------------------------------

    // Shared staff/cashier accounts are exempt so password login at the
    // workstation completes without a personal email code. Admin and customer
    // accounts that already enrolled MFA are always challenged; the rest are
    // forced to enroll when MFA is required globally (production builds,
    // unless the admin switched it off in Admin Settings). In development
    // the challenge is skipped so seeded accounts aren't locked.
    if (
      mfaAppliesToRole(user.role) &&
      (user.mfaEnabled || (await isMfaRequiredGlobally()))
    ) {
      const mfaToken = generateMfaToken(user.id)
      const data: LoginChallengeData = {
        requiresMfa: true,
        mfaToken,
      }
      return NextResponse.json(
        {
          success: true,
          message: user.mfaEnabled ? "MFA code required" : "MFA setup required",
          data,
        },
        { status: 200 }
      )
    }

    // --- Issue JWT & return it in the response body ------------------------

    const token = generateToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          token,
          user: {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            image: user.image,
            branch: user.branch,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            canManageUnits: user.canManageUnits,
            canManageCategories: user.canManageCategories,
            canManageProducts: user.canManageProducts,
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Login error:", error)
    const message =
      process.env.NODE_ENV === "production"
        ? "An error occurred during login"
        : error instanceof Error
          ? error.message
          : "An error occurred during login"
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
