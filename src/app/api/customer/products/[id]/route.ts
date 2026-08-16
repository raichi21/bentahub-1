import { NextRequest } from "next/server"
import { db } from "@/drizzle/db"
import { products, branches, branchInventory, inventoryBatches } from "@/drizzle/schema"
import { eq, and, inArray, isNotNull, gte } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

/**
 * Compute the earliest future expiry date for a product in a given branch.
 *
 * When a branch is requested, the expiry is computed ONLY from that branch's
 * inventory — falling back to another branch would show a customer an expiry
 * that doesn't apply to what they're buying, so it returns `null` instead.
 * When no branch is requested, best-effort fallbacks are fine.
 */
async function getNearestExpiry(productId: string, branchName: string | null): Promise<string | null> {
  const now = new Date()

  let inventory = null

  if (branchName) {
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })
    if (!branchRecord) return null
    inventory = await db.query.branchInventory.findMany({
      where: and(
        eq(branchInventory.productId, productId),
        eq(branchInventory.branchId, branchRecord.id),
      ),
    })
  } else {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })
    if (product?.branch) {
      const branchRecord = await db.query.branches.findFirst({
        where: eq(branches.name, product.branch),
      })
      if (branchRecord) {
        inventory = await db.query.branchInventory.findMany({
          where: and(
            eq(branchInventory.productId, productId),
            eq(branchInventory.branchId, branchRecord.id),
          ),
        })
      }
    }

    if (!inventory || inventory.length === 0) {
      inventory = await db.query.branchInventory.findMany({
        where: eq(branchInventory.productId, productId),
      })
    }
  }

  if (!inventory || inventory.length === 0) return null

  const inventoryIds = inventory.map((i) => i.id)
  const batches = await db.query.inventoryBatches.findMany({
    where: and(
      inArray(inventoryBatches.branchInventoryId, inventoryIds),
      isNotNull(inventoryBatches.expiryDate),
      gte(inventoryBatches.quantity, 1),
    ),
  })

  const futureDates = batches
    .map((b) => b.expiryDate)
    .filter((d): d is Date => d !== null && new Date(d) > now)

  if (futureDates.length === 0) return null
  return futureDates.reduce((prev, curr) => (prev < curr ? prev : curr)).toISOString()
}

/**
 * GET /api/customer/products/[id]
 * Retrieve a single product by ID
 * Query params:
 * - branch: optional branch name used to compute the product's nearest expiry date
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const branch = request.nextUrl.searchParams.get("branch")

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
      nearestExpiry: await getNearestExpiry(id, branch),
    }

    return apiResponse({ success: true, data: formatted })
  } catch (error) {
    console.error("Error fetching product:", error)
    return apiError("Failed to fetch product", 500)
  }
}
