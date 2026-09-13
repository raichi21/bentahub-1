import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { extractToken, checkRoleAuth, requirePermission, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { unitTypes } from "@/servers/schemas"
import { eq, desc, sql } from "drizzle-orm"

const createUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(50),
  description: z.string().max(255).nullable().optional(),
})

const updateUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(50).optional(),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkRoleAuth(token, ["admin", "staff"], "Product catalog")
    if (auth.error) return auth.error

    const list = await db.query.unitTypes.findMany({
      orderBy: desc(unitTypes.createdAt),
    })

    return NextResponse.json({ success: true, data: list }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Get units error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageUnits")
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = createUnitSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { name, description } = parsed.data
    const normalizedName = name.trim().toLowerCase()

    const nameClash = await db.query.unitTypes.findFirst({
      where: sql`lower(${unitTypes.name}) = lower(${normalizedName})`,
    })
    if (nameClash) {
      return NextResponse.json({ success: false, message: "A unit with this name already exists" }, { status: 409 })
    }

    const [created] = await db.insert(unitTypes)
      .values({
        id: generateId(),
        name: normalizedName,
        description: description ?? null,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ success: true, message: "Unit created successfully", data: created }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Create unit error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageUnits")
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "Unit id is required" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateUnitSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const existing = await db.query.unitTypes.findFirst({ where: eq(unitTypes.id, id) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "Unit not found" }, { status: 404 })
    }

    const updateData: Partial<typeof unitTypes.$inferInsert> = {}
    if (parsed.data.name !== undefined) {
      const normalizedName = parsed.data.name.trim().toLowerCase()
      const nameClash = await db.query.unitTypes.findFirst({
        where: sql`lower(${unitTypes.name}) = lower(${normalizedName})`,
      })
      if (nameClash && nameClash.id !== id) {
        return NextResponse.json({ success: false, message: "A unit with this name already exists" }, { status: 409 })
      }
      updateData.name = normalizedName
    }
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    const [updated] = await db.update(unitTypes)
      .set(updateData)
      .where(eq(unitTypes.id, id))
      .returning()

    return NextResponse.json({ success: true, message: "Unit updated successfully", data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Update unit error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageUnits")
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "Unit id is required" }, { status: 400 })
    }

    const existing = await db.query.unitTypes.findFirst({ where: eq(unitTypes.id, id) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "Unit not found" }, { status: 404 })
    }

    // Soft delete — units may still be referenced by existing products.
    await db.update(unitTypes)
      .set({ isActive: false })
      .where(eq(unitTypes.id, id))

    return NextResponse.json({ success: true, message: "Unit deactivated successfully" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Delete unit error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}