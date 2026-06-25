import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, extractToken, hashPassword, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"

const ADMIN_DOMAIN = "@bentahub.com"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address").refine(
    (email) => email.toLowerCase().endsWith(ADMIN_DOMAIN),
    { message: `Only ${ADMIN_DOMAIN} emails are allowed for staff/cashier accounts` }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["cashier", "staff"], { message: "Role must be cashier or staff" }),
  branch: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    }
    if (payload.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { email, password, fullName, role, branch } = parsed.data

    // Check if email already exists
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const userId = generateId()

    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      fullName,
      role,
      branch: branch || null,
      isEmailVerified: true,
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      data: { userId, email, fullName, role, branch: branch || null },
    }, { status: 201 })
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
