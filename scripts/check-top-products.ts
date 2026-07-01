import fs from "fs"
import path from "path"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        let val = trimmed.slice(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    }
  }
}

const [{ db }, { transactionItems }] = await Promise.all([
  import("../src/servers/db") as Promise<{ db: import("../src/servers/db").Database }>,
  import("../src/servers/schemas"),
])
const { sql, desc } = await import("drizzle-orm")

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
  .limit(10)

console.log("Results:", JSON.stringify(results, null, 2))
console.log("Count:", results.length)
