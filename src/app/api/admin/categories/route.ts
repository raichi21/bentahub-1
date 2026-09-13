import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { extractToken, checkRoleAuth, requirePermission, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { categories } from "@/servers/schemas"
import { eq, desc, sql } from "drizzle-orm"

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  code: z.string().min(1, "Category code is required").max(10),
  description: z.string().max(255).nullable().optional(),
})

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100).optional(),
  code: z.string().min(1, "Category code is required").max(10).optional(),
  description: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
})

/** Normalize the category name (trim + title case). */
function normalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkRoleAuth(token, ["admin", "staff"], "Product catalog")
    if (auth.error) return auth.error

    const list = await db.query.categories.findMany({
      orderBy: desc(categories.createdAt),
    })

    return NextResponse.json({ success: true, data: list }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Get categories error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageCategories")
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const { name, code, description } = parsed.data
    const normalizedName = normalizeName(name)
    const normalizedCode = code.trim().toUpperCase()

    const nameClash = await db.query.categories.findFirst({
      where: sql`lower(${categories.name}) = lower(${normalizedName})`,
    })
    if (nameClash) {
      return NextResponse.json({ success: false, message: "A category with this name already exists" }, { status: 409 })
    }

    const codeClash = await db.query.categories.findFirst({
      where: sql`lower(${categories.code}) = lower(${normalizedCode})`,
    })
    if (codeClash) {
      return NextResponse.json({ success: false, message: "A category with this code already exists" }, { status: 409 })
    }

    const [created] = await db.insert(categories)
      .values({
        id: generateId(),
        name: normalizedName,
        code: normalizedCode,
        description: description ?? null,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ success: true, message: "Category created successfully", data: created }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Create category error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageCategories")
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "Category id is required" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json({ success: false, message: firstError }, { status: 400 })
    }

    const existing = await db.query.categories.findFirst({ where: eq(categories.id, id) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 })
    }

    const updateData: Partial<typeof categories.$inferInsert> = {}
    if (parsed.data.name !== undefined) {
      const normalizedName = normalizeName(parsed.data.name)
      const nameClash = await db.query.categories.findFirst({
        where: sql`lower(${categories.name}) = lower(${normalizedName})`,
      })
      if (nameClash && nameClash.id !== id) {
        return NextResponse.json({ success: false, message: "A category with this name already exists" }, { status: 409 })
      }
      updateData.name = normalizedName
    }
    if (parsed.data.code !== undefined) {
      const normalizedCode = parsed.data.code.trim().toUpperCase()
      const codeClash = await db.query.categories.findFirst({
        where: sql`lower(${categories.code}) = lower(${normalizedCode})`,
      })
      if (codeClash && codeClash.id !== id) {
        return NextResponse.json({ success: false, message: "A category with this code already exists" }, { status: 409 })
      }
      updateData.code = normalizedCode
    }
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive

    const [updated] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()

    return NextResponse.json({ success: true, message: "Category updated successfully", data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Update category error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageCategories")
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, message: "Category id is required" }, { status: 400 })
    }

    const existing = await db.query.categories.findFirst({ where: eq(categories.id, id) })
    if (!existing) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 })
    }

    // Soft delete — categories may still be referenced by existing products.
    await db.update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, id))

    return NextResponse.json({ success: true, message: "Category deactivated successfully" })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Delete category error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}