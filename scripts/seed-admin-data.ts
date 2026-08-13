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
  const { users, branches, branchInventory, products, transactions, transactionItems } = await import("@/servers/schemas")
  const { hashPassword, generateId } = await import("@/lib/auth-utils")

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
    { id: generateId(), name: "Lourdes Second Branch", location: "456 Second Ave, Quezon City", isMain: false },
    { id: generateId(), name: "Lourdes Third Branch", location: "789 Third Blvd, Makati", isMain: false },
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
    { name: "Safeguard Bar Soap", category: "Personal Care", price: "45.00", sku: "SKU-SAFEGUARD", stock: 150, image: "/images/landing/safeguard.png" },
    { name: "Lucky Me! Pancit Canton", category: "Instant Meals", price: "15.00", sku: "SKU-PANCIT-CANTON", stock: 200, image: "/images/landing/pancit-canton.png" },
    { name: "Asukal (White Sugar)", category: "Pantry", price: "60.00", sku: "SKU-ASUKAL", stock: 100, image: "/images/landing/asukal.png" },
    { name: "Buko Pandan Rice", category: "Grains", price: "55.00", sku: "SKU-RICE", stock: 120, image: "/images/landing/rice.png" },
    { name: "Cooking Oil", category: "Pantry", price: "35.00", sku: "SKU-COOKING-OIL", stock: 180, image: "/images/landing/cooking-oil.png" },
    { name: "Jack 'n Jill VCut Chips", category: "Snacks", price: "25.00", sku: "SKU-VCUT", stock: 160, image: "/images/landing/vcut.png" },
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
      image: prod.image,
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
