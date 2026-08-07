import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { extractToken, checkAdminAuth, hashPassword, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { sql } from "drizzle-orm"
import { getUsers } from "@/features/admin-dashboard/actions/get-users"

const ADMIN_DOMAIN = "@bentahub.com"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address").refine(
    (email) => email.toLowerCase().endsWith(ADMIN_DOMAIN),
    { message: `Only ${ADMIN_DOMAIN} emails are allowed` }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["admin", "cashier", "staff"], { message: "Role must be admin, cashier, or staff" }),
  branch: z.string().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") || undefined
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const data = await getUsers({ role, search, page, pageSize })

    return NextResponse.json({ success: true, message: "Users retrieved successfully", data })
  } catch (error) {
    console.error("Admin get users error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { email, password, fullName, role, branch } = parsed.data

    console.log("[POST] Checking email:", email, "new name:", fullName)

    // Use raw SQL to avoid any ORM proxy issues
    const result = await db.execute(
      sql`SELECT id, full_name, is_active FROM users WHERE email = ${email} LIMIT 1`
    )
    const existing = result[0] ?? null

    if (existing) {
      console.log("[POST] Found user:", { id: existing.id, name: existing.full_name, active: existing.is_active })
    } else {
      console.log("[POST] No existing user found")
    }

    if (existing && existing.is_active) {
      return NextResponse.json({ success: false, message: "Email already registered" }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    if (existing && !existing.is_active) {
      console.log("[POST] Reactivating user:", existing.id, "with name:", fullName)

      await db.execute(
        sql`UPDATE users SET full_name = ${fullName}, password = ${hashedPassword}, role = ${role}, branch = ${branch || null}, is_active = true, is_email_verified = true, updated_at = NOW() WHERE id = ${existing.id}`
      )

      console.log("[POST] Reactivation done for:", existing.id)

      return NextResponse.json({
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} account reactivated successfully`,
        data: { userId: existing.id, email, fullName, role, branch: branch || null },
      })
    }

    const userId = generateId()

    await db.execute(
      sql`INSERT INTO users (id, email, password, full_name, role, branch, is_active, is_email_verified, created_at, updated_at) VALUES (${userId}, ${email}, ${hashedPassword}, ${fullName}, ${role}, ${branch || null}, true, true, NOW(), NOW())`
    )

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
