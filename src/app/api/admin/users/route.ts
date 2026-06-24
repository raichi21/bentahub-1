import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, extractToken, generateId, hashPassword } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import type { AdminApiResponse } from "@/types/admin"

const createUserSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cashier", "staff"]),
  branch: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse<AdminApiResponse>> {
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
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { fullName, email, password, role, branch } = parsed.data

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (existing) {
      return NextResponse.json({ success: false, message: "Email already in use" }, { status: 409 })
    }

    const hashed = await hashPassword(password)

    await db.insert(users).values({
      id: generateId(),
      email,
      password: hashed,
      fullName,
      role,
      branch: branch || null,
      isEmailVerified: true,
      isActive: true,
    })

    return NextResponse.json(
      { success: true, message: "User created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Admin create user error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while creating user" },
      { status: 500 }
    )
  }
}
