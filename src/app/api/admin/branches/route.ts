import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { extractToken, checkAdminAuth, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { branches } from "@/servers/schemas"
import { eq, desc } from "drizzle-orm"

const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(255),
  location: z.string().max(255).nullable().optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
})

const updateBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(255),
  location: z.string().max(255).nullable().optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const list = await db.query.branches.findMany({
      orderBy: desc(branches.createdAt),
    })

    return NextResponse.json({ success: true, data: list }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Admin get branches error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = createBranchSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { name, location, capacity } = parsed.data

    const existing = await db.query.branches.findFirst({
      where: eq(branches.name, name),
    })
    if (existing) {
      return NextResponse.json({ success: false, message: "A branch with this name already exists" }, { status: 409 })
    }

    const [created] = await db.insert(branches)
      .values({
        id: generateId(),
        name,
        location: location ?? null,
        capacity: capacity ?? 500,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ success: true, message: "Branch created successfully", data: created }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Admin create branch error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "Branch id is required" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateBranchSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { name, location, capacity, isActive } = parsed.data

    const existing = await db.query.branches.findFirst({
      where: eq(branches.id, id),
    })
    if (!existing) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const nameClash = await db.query.branches.findFirst({
      where: eq(branches.name, name),
    })
    if (nameClash && nameClash.id !== id) {
      return NextResponse.json({ success: false, message: "A branch with this name already exists" }, { status: 409 })
    }

    const updateData: Partial<typeof branches.$inferInsert> = { name }
    if (location !== undefined) updateData.location = location
    if (capacity !== undefined) updateData.capacity = capacity
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db.update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning()

    return NextResponse.json({ success: true, message: "Branch updated successfully", data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Admin update branch error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
