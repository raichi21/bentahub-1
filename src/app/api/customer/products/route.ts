import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { products } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

/**
 * GET /api/customer/products
 * Retrieve all active products
 * Query params:
 * - category: filter by category
 * - branch: filter by branch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const branch = searchParams.get("branch")

    const conditions = [eq(products.isActive, true)]

    if (category) {
      conditions.push(eq(products.category, category))
    }

    if (branch) {
      conditions.push(eq(products.branch, branch))
    }

    const allProducts = await db
      .select()
      .from(products)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(products.createdAt)

    // Format to return numeric prices
    const formatted = allProducts.map((p) => ({
      ...p,
      price: Number(p.price),
      bulkPrice: p.bulkPrice ? Number(p.bulkPrice) : undefined,
    }))

    return apiResponse(formatted)
  } catch (error) {
    console.error("Error fetching products:", error)
    return apiError("Failed to fetch products", 500)
  }
}
