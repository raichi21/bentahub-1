import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

// Load .env.local before importing app modules
const envPath = resolve(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  const envConfig = readFileSync(envPath, "utf-8")
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=")
      const val = valueParts.join("=").replace(/^["']|["']$/g, "")
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/bentahub"
}

async function run() {
  const { db } = await import("@/servers/db")
  const {
    inventoryBatches,
    branchInventory,
    products,
    transactionItems,
    transactions,
    orderItems,
    orders,
    cartItems,
    notifications,
    users,
    branches,
  } = await import("@/servers/schemas")

  const count = async (label: string, table: any) => {
    const rows = await db.select({ id: table.id }).from(table)
    console.log(`  ${label}: ${rows.length}`)
    return rows.length
  }

  console.log("🧹 Starting BentaHub data clear...")

  // ── Before counts ──
  console.log("\n📊 Before:")
  const tablesToClear = [
    ["inventory_batches", inventoryBatches],
    ["branch_inventory", branchInventory],
    ["products", products],
    ["transaction_items", transactionItems],
    ["transactions", transactions],
    ["order_items", orderItems],
    ["orders", orders],
    ["cart_items", cartItems],
    ["notifications", notifications],
  ] as const
  for (const [label, table] of tablesToClear) {
    await count(label, table)
  }
  await count("users (kept)", users)
  await count("branches (kept)", branches)

  // ── Delete in FK-safe order ──
  console.log("\n🗑️  Clearing data...")
  await db.delete(inventoryBatches).catch((e) => console.error("    inventory_batches:", e.message))
  await db.delete(branchInventory).catch((e) => console.error("    branch_inventory:", e.message))
  await db.delete(products).catch((e) => console.error("    products:", e.message))
  await db.delete(transactionItems).catch((e) => console.error("    transaction_items:", e.message))
  await db.delete(transactions).catch((e) => console.error("    transactions:", e.message))
  await db.delete(orderItems).catch((e) => console.error("    order_items:", e.message))
  await db.delete(orders).catch((e) => console.error("    orders:", e.message))
  await db.delete(cartItems).catch((e) => console.error("    cart_items:", e.message))
  await db.delete(notifications).catch((e) => console.error("    notifications:", e.message))

  // ── After counts ──
  console.log("\n📊 After:")
  for (const [label, table] of tablesToClear) {
    await count(label, table)
  }
  await count("users (kept)", users)
  await count("branches (kept)", branches)

  console.log("\n✅ Data clear complete! Users and branches preserved.")
  process.exit(0)
}

run().catch((err) => {
  console.error("❌ Data clear failed:", err)
  process.exit(1)
})
