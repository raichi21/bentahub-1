import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { verifyPassword, generateToken } from "@/lib/auth-utils"
import type { AuthResponse, LoginResponseData } from "@/types/auth"

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * On success, returns the JWT token and user data in the response body.
 */
export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse<LoginResponseData>>> {
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
        { success: false, message: "Your account has been deactivated. Please contact the administrator." },
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
        { success: false, message: "This account uses a social sign-in. Please use the Google or Facebook button to log in." },
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
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred during login" },
      { status: 500 }
    )
  }
}
