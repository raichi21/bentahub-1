import { db } from "@/servers/db"
import { transactionItems } from "@/servers/schemas"
import { sql, desc } from "drizzle-orm"
import type { TopProductData } from "@/types/admin"

export async function getTopProducts(limit = 10): Promise<TopProductData[]> {
  const results = await db
    .select({
      productId: transactionItems.productId,
      productName: transactionItems.productName,
      totalSold: sql<number>`CAST(SUM(${transactionItems.quantity}) AS INTEGER)`,
      totalRevenue: sql<number>`CAST(SUM(${transactionItems.subtotal}) AS NUMERIC(10,2))`,
    })
    .from(transactionItems)
    .groupBy(transactionItems.productId, transactionItems.productName)
    .orderBy(desc(sql`SUM(${transactionItems.quantity})`))
    .limit(limit)

  return results.map((r, i) => ({
    productId: r.productId,
    productName: r.productName,
    totalSold: r.totalSold,
    totalRevenue: Number(r.totalRevenue),
    rank: i + 1,
  }))
}
