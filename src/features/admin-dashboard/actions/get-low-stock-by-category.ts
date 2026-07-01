import { db } from "@/servers/db"
import { branchInventory, products } from "@/servers/schemas"
import { sql } from "drizzle-orm"
import type { LowStockByCategoryData } from "@/types/admin"

export async function getLowStockByCategory(): Promise<LowStockByCategoryData[]> {
  const inventoryWithProducts = await db
    .select({
      quantity: branchInventory.quantity,
      threshold: branchInventory.lowStockThreshold,
      category: products.category,
    })
    .from(branchInventory)
    .innerJoin(products, sql`${branchInventory.productId} = ${products.id}`)

  const categoryMap = new Map<string, { total: number; lowStock: number }>()

  for (const item of inventoryWithProducts) {
    const cat = item.category
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { total: 0, lowStock: 0 })
    }
    const entry = categoryMap.get(cat)!
    entry.total++
    if (item.quantity < item.threshold) {
      entry.lowStock++
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, { total, lowStock }]) => ({
      category,
      totalItems: total,
      lowStockCount: lowStock,
      lowStockPercentage: total > 0 ? Math.round((lowStock / total) * 100) : 0,
    }))
    .sort((a, b) => b.lowStockPercentage - a.lowStockPercentage)
}
