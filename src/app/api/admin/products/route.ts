import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  extractToken,
  checkRoleAuth,
  requirePermission,
} from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { products, categories, unitTypes } from "@/servers/schemas"
import { logActivity } from "@/lib/activity-log"
import { eq, desc, sql, and, or, ilike } from "drizzle-orm"

const updateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().min(1, "Category is required").max(100).optional(),
  unit: z.string().min(1, "Unit is required").max(50).optional(),
  price: z.number().positive().optional(),
  bulkPrice: z.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    const auth = checkRoleAuth(token, ["admin", "staff"], "Product catalog")
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.toLowerCase() || ""
    const category = searchParams.get("category") || ""
    const branch = searchParams.get("branch") || ""
    // Server-side cap: the list UI renders a single scrollable table, so a
    // bounded page keeps payloads (and pooler egress) flat as the catalog
    // grows. Clients ignore the extra meta fields.
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "100"), 1),
      200
    )

    const conditions = []
    if (category) conditions.push(eq(products.category, category))
    if (branch) conditions.push(eq(products.branch, branch))
    if (search) {
      const pattern = `%${search}%`
      conditions.push(
        or(ilike(products.name, pattern), ilike(products.sku, pattern))
      )
    }

    const list = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(products.createdAt),
      limit,
    })

    const [{ n: totalCount }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return NextResponse.json(
      {
        success: true,
        data: list,
        meta: { totalCount: Number(totalCount), limit },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Get products error:", message)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await requirePermission(request, "canManageProducts")
    if (auth.error) return auth.error

    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product id is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      const errorMap = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errorMap)[0]?.[0] || "Validation failed"
      return NextResponse.json(
        { success: false, message: firstError },
        { status: 400 }
      )
    }

    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    const updateData: Partial<typeof products.$inferInsert> = {}
    if (parsed.data.name !== undefined)
      updateData.name = parsed.data.name.trim()
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description

    if (parsed.data.category !== undefined) {
      const categoryRecord = await db.query.categories.findFirst({
        where: sql`lower(${categories.name}) = lower(${parsed.data.category})`,
      })
      if (!categoryRecord) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category not recognized. Please select an existing category.",
          },
          { status: 400 }
        )
      }
      updateData.category = categoryRecord.name
    }

    if (parsed.data.unit !== undefined) {
      const unitRecord = await db.query.unitTypes.findFirst({
        where: sql`lower(${unitTypes.name}) = lower(${parsed.data.unit})`,
      })
      if (!unitRecord) {
        return NextResponse.json(
          {
            success: false,
            message: "Unit not recognized. Please select an existing unit.",
          },
          { status: 400 }
        )
      }
      updateData.unit = unitRecord.name
    }

    if (parsed.data.price !== undefined)
      updateData.price = parsed.data.price.toString()
    if (parsed.data.bulkPrice !== undefined)
      updateData.bulkPrice =
        parsed.data.bulkPrice === null ? null : parsed.data.bulkPrice.toString()
    if (parsed.data.isActive !== undefined)
      updateData.isActive = parsed.data.isActive

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    logActivity({
      actorId: auth.userId,
      action: "product.update",
      entity: "product",
      entityId: id,
      entityName: updated.name,
      details: { changedFields: Object.keys(updateData) },
    })

    return NextResponse.json(
      { success: true, message: "Product updated successfully", data: updated },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Update product error:", message)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    )
  }
}
