import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, extractToken, hashPassword } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "cashier", "staff", "customer"]).optional(),
  branch: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  // Optional — when present, the admin resets the user's password.
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
})

/** Internal work-account domain required for cashier/staff accounts. */
const INTERNAL_DOMAIN = "@bentahub.com"

function checkAuth(token: string | null): { userId?: string; error?: NextResponse } {
  if (!token) {
    return { error: NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 }) }
  }
  const payload = verifyToken(token)
  if (!payload) {
    return { error: NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 }) }
  }
  if (payload.role !== "admin") {
    return { error: NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 }) }
  }
  return { userId: payload.userId }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAuth(token)
    if (auth.error) return auth.error

    const { userId } = await params

    const existing = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    // Hash an optional new password before it touches the database — the
    // raw value is never persisted. When absent, the existing password stays.
    const { password, ...rest } = parsed.data

    const effectiveRole = rest.role ?? existing.role
    const effectiveEmail = rest.email ?? existing.email
    if (
      (effectiveRole === "cashier" || effectiveRole === "staff") &&
      !effectiveEmail.toLowerCase().endsWith(INTERNAL_DOMAIN)
    ) {
      return NextResponse.json(
        { success: false, message: `Cashier and Staff accounts require an ${INTERNAL_DOMAIN} email` },
        { status: 400 }
      )
    }

    const updateData = {
      ...rest,
      ...(password ? { password: await hashPassword(password) } : {}),
      updatedAt: new Date(),
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    console.error("Admin update user error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAuth(token)
    if (auth.error) return auth.error

    const { userId } = await params

    const existing = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Soft delete — deactivate instead of removing
    await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true, message: "User deactivated successfully" })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
