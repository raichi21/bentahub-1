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

import { db } from "@/servers/db"
import { users, branches, branchInventory, products, transactions, transactionItems } from "@/servers/schemas"
import { hashPassword, generateId } from "@/lib/auth-utils"

async function run() {
  console.log("🌱 Starting BentaHub database seed...")

  // 1. Clear existing tables
  console.log("🗑️  Clearing existing data...")
  await db.delete(transactionItems).catch(() => {})
  await db.delete(transactions).catch(() => {})
  await db.delete(branchInventory).catch(() => {})
  await db.delete(products).catch(() => {})
  await db.delete(users).catch(() => {})
  await db.delete(branches).catch(() => {})

  // 2. Seed Branches
  console.log("🏢 Creating 3 store branches...")
  const branchList = [
    { id: generateId(), name: "Lourdes Main Branch", location: "123 Main St, Manila", isMain: true },
    { id: generateId(), name: "North Branch", location: "456 North Ave, Quezon City", isMain: false },
    { id: generateId(), name: "South Branch", location: "789 South Blvd, Makati", isMain: false },
  ]
  await db.insert(branches).values(
    branchList.map((b) => ({
      id: b.id,
      name: b.name,
      location: b.location,
      capacity: 500,
      isActive: true,
    }))
  )

  // 3. Seed Users
  console.log("👑 Creating admin user (admin@bentahub.com)...")
  const adminPasswordHash = await hashPassword("admin123")
  const staffPasswordHash = await hashPassword("staff123")
  const cashierPasswordHash = await hashPassword("cash123")
  const customerPasswordHash = await hashPassword("cust123")

  await db.insert(users).values([
    {
      id: generateId(),
      email: "admin@bentahub.com",
      password: adminPasswordHash,
      fullName: "System Admin",
      role: "admin",
      branch: "Lourdes Main Branch",
      isEmailVerified: true,
      isActive: true,
    },
    {
      id: generateId(),
      email: "staff1@bentahub.com",
      password: staffPasswordHash,
      fullName: "Staff One",
      role: "staff",
      branch: "Lourdes Main Branch",
      isEmailVerified: true,
      isActive: true,
    },
    {
      id: generateId(),
      email: "cashier1@bentahub.com",
      password: cashierPasswordHash,
      fullName: "Cashier One",
      role: "cashier",
      branch: "Lourdes Main Branch",
      isEmailVerified: true,
      isActive: true,
    },
    {
      id: generateId(),
      email: "customer1@gmail.com",
      password: customerPasswordHash,
      fullName: "Juan Dela Cruz",
      role: "customer",
      branch: null,
      isEmailVerified: true,
      isActive: true,
    },
  ])

  // 4. Seed Products & Inventory
  console.log("🛍️  Creating sample products...")
  const sampleProducts = [
    { name: "Kopiko Blanca TWIN", category: "Coffee", price: "15.00", sku: "SKU-KOPIKO-BLANCA", stock: 150 },
    { name: "Kopiko Brown TWIN", category: "Coffee", price: "15.00", sku: "SKU-KOPIKO-BROWN", stock: 120 },
    { name: "Nescafé 3-in-1 Original", category: "Coffee", price: "12.00", sku: "SKU-NESCAFE-ORIG", stock: 200 },
    { name: "Great Taste White Twin", category: "Coffee", price: "14.00", sku: "SKU-GT-WHITE", stock: 180 },
    { name: "Milo Active-Go 22g", category: "Beverages", price: "10.00", sku: "SKU-MILO-22G", stock: 250 },
    { name: "Bear Brand Powdered 33g", category: "Beverages", price: "18.00", sku: "SKU-BEARBRAND-33G", stock: 160 },
  ]

  for (const prod of sampleProducts) {
    const prodId = generateId()
    await db.insert(products).values({
      id: prodId,
      name: prod.name,
      category: prod.category,
      price: prod.price,
      sku: prod.sku,
      branch: "Lourdes Main Branch",
      quantity: prod.stock,
      stockStatus: "in-stock",
      isActive: true,
    })

    for (const b of branchList) {
      await db.insert(branchInventory).values({
        id: generateId(),
        branchId: b.id,
        productId: prodId,
        quantity: prod.stock,
        lowStockThreshold: 10,
      })
    }
  }

  console.log("✅ BentaHub database seeded successfully!")
  console.log("\nSummary:")
  console.log("- Admin User: admin@bentahub.com / admin123")
  console.log("- Staff User: staff1@bentahub.com / staff123")
  console.log("- Cashier User: cashier1@bentahub.com / cash123")
  console.log("- Customer User: customer1@gmail.com / cust123")
  process.exit(0)
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})
