import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { products } from "@/servers/schemas"
import { eq } from "drizzle-orm"

/**
 * GET /api/customer/products/[id]
 * Retrieve a single product by ID
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!product.length) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      )
    }

    const p = product[0]
    const formatted = {
      ...p,
      price: Number(p.price),
      bulkPrice: p.bulkPrice ? Number(p.bulkPrice) : undefined,
    }

    return NextResponse.json({ success: true, data: formatted }, { status: 200 })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    )
  }
}
