import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { products } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

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
      return apiError("Product not found", 404)
    }

    const p = product[0]
    const formatted = {
      ...p,
      price: Number(p.price),
      bulkPrice: p.bulkPrice ? Number(p.bulkPrice) : undefined,
    }

    return apiResponse({ success: true, data: formatted })
  } catch (error) {
    console.error("Error fetching product:", error)
    return apiError("Failed to fetch product", 500)
  }
}
