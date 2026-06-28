import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import type { AuthResponse } from "@/types/auth"

/**
 * GET /api/auth/verify
 *
 * Validates the JWT from the Authorization header and returns
 * the current user's data. Used by the frontend AuthProvider to
 * hydrate session state on page load.
 */
export async function GET(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      )
    }

    // --- Decode JWT ----------------------------------------------------------

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      )
    }

    // --- Fetch fresh user data from DB --------------------------------------

    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User not found or deactivated" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Token is valid",
        data: {
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          branch: user.branch,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Token verification error:", message, error)

    // Distinguish DB connection errors from other failures
    if (message.includes("connect") || message.includes("ECONNREFUSED") || message.includes("getaddrinfo")) {
      return NextResponse.json(
        { success: false, message: "Database connection failed. Please ensure PostgreSQL is running." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, message: "An error occurred during verification" },
      { status: 500 }
    )
  }
}
