import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { products, branchInventory, branches } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

/**
 * GET /api/customer/products
 * Retrieve all active products for a given branch (using branchInventory).
 * Query params:
 * - category: filter by category
 * - branch: filter by branch name (uses branchInventory join for stock-per-branch)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const branch = searchParams.get("branch")

    // Build query: branchInventory → products → branches (for stock-per-branch)
    const conditions: ReturnType<typeof and>[] = [eq(products.isActive, true)]

    if (branch) {
      conditions.push(eq(branches.name, branch))
    }

    if (category) {
      conditions.push(eq(products.category, category))
    }

    const results = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        price: products.price,
        bulkPrice: products.bulkPrice,
        weight: products.weight,
        image: products.image,
        sku: products.sku,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        // Stock info from branchInventory
        quantity: branchInventory.quantity,
        lowStockThreshold: branchInventory.lowStockThreshold,
        branchName: branches.name,
      })
      .from(branchInventory)
      .innerJoin(products, eq(branchInventory.productId, products.id))
      .innerJoin(branches, eq(branchInventory.branchId, branches.id))
      .where(and(...conditions))
      .orderBy(products.createdAt)

    // Deduplicate by product ID (same product may appear across branches if no branch filter)
    const seen = new Set<string>()
    const uniqueProducts = results.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    // Format to match the store's Product shape
    const formatted = uniqueProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: Number(p.price),
      bulkPrice: p.bulkPrice ? Number(p.bulkPrice) : undefined,
      weight: p.weight,
      image: p.image,
      sku: p.sku,
      isActive: p.isActive,
      quantity: p.quantity,
      branch: p.branchName,
      stockStatus: (
        p.quantity === 0 ? "out-of-stock"
        : p.quantity <= p.lowStockThreshold ? "low-stock"
        : "in-stock"
      ) as "in-stock" | "low-stock" | "out-of-stock",
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))

    return apiResponse(formatted)
  } catch (error) {
    console.error("Error fetching products:", error)
    return apiError("Failed to fetch products", 500)
  }
}
