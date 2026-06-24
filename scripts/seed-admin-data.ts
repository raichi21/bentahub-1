import fs from "fs"
import path from "path"
import { db } from "../src/servers/db"
import {
  branches,
  products,
  branchInventory,
  transactions,
  users,
} from "../src/servers/schemas"
import { hashPassword } from "../src/lib/auth-utils"
import { sql } from "drizzle-orm"

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

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const BRANCHES = [
  { name: "Lourdes Main Branch", location: "123 Main St, Lourdes", capacity: 500 },
  { name: "Lourdes Second Branch", location: "456 Oak Ave, Lourdes", capacity: 400 },
  { name: "Lourdes Third Branch", location: "789 Pine Rd, Lourdes", capacity: 350 },
]

const CATEGORIES = ["Beverages", "Snacks", "Canned Goods", "Rice & Noodles", "Personal Care", "Household", "Dairy", "Frozen"]

const PRODUCTS: Array<{ name: string; sku: string; price: number; category: string }> = [
  { name: "Coca-Cola 1.5L", sku: "BEV-001", price: 55.00, category: "Beverages" },
  { name: "Sprite 1.5L", sku: "BEV-002", price: 55.00, category: "Beverages" },
  { name: "Royal 1.5L", sku: "BEV-003", price: 55.00, category: "Beverages" },
  { name: "Mountain Dew 1.5L", sku: "BEV-004", price: 55.00, category: "Beverages" },
  { name: "Bottled Water 500ml", sku: "BEV-005", price: 12.00, category: "Beverages" },
  { name: "Sting Energy Drink", sku: "BEV-006", price: 15.00, category: "Beverages" },
  { name: "Piattos Sour Cream", sku: "SNK-001", price: 25.00, category: "Snacks" },
  { name: "Oishi Prawn Crackers", sku: "SNK-002", price: 10.00, category: "Snacks" },
  { name: "Nova Country Cheddar", sku: "SNK-003", price: 25.00, category: "Snacks" },
  { name: "Chippy Barbecue", sku: "SNK-004", price: 10.00, category: "Snacks" },
  { name: "Cornick Chili", sku: "SNK-005", price: 12.00, category: "Snacks" },
  { name: "Canned Corned Beef", sku: "CND-001", price: 45.00, category: "Canned Goods" },
  { name: "Canned Sardines", sku: "CND-002", price: 25.00, category: "Canned Goods" },
  { name: "Canned Tuna", sku: "CND-003", price: 35.00, category: "Canned Goods" },
  { name: "Canned Pork & Beans", sku: "CND-004", price: 28.00, category: "Canned Goods" },
  { name: "5kg Rice", sku: "RIC-001", price: 150.00, category: "Rice & Noodles" },
  { name: "Pancit Canton", sku: "RIC-002", price: 18.00, category: "Rice & Noodles" },
  { name: "Instant Noodles (Cup)", sku: "RIC-003", price: 20.00, category: "Rice & Noodles" },
  { name: "Instant Noodles (Packet)", sku: "RIC-004", price: 12.00, category: "Rice & Noodles" },
  { name: "Bar Soap", sku: "PCR-001", price: 15.00, category: "Personal Care" },
  { name: "Shampoo Sachet", sku: "PCR-002", price: 7.00, category: "Personal Care" },
  { name: "Toothpaste", sku: "PCR-003", price: 35.00, category: "Personal Care" },
  { name: "Dishwashing Liquid", sku: "HSE-001", price: 30.00, category: "Household" },
  { name: "Laundry Detergent", sku: "HSE-002", price: 25.00, category: "Household" },
  { name: "Fresh Milk 1L", sku: "DRY-001", price: 85.00, category: "Dairy" },
  { name: "Powdered Milk 400g", sku: "DRY-002", price: 55.00, category: "Dairy" },
  { name: "Ice Cream 1L", sku: "FRZ-001", price: 120.00, category: "Frozen" },
  { name: "Frozen Chicken 1kg", sku: "FRZ-002", price: 180.00, category: "Frozen" },
]

async function seedData(): Promise<void> {
  console.log("Clearing existing data...")
  await db.delete(transactions)
  await db.delete(branchInventory)
  await db.delete(products)
  await db.delete(branches)
  await db.delete(users)

  const now = new Date()
  const branchIds: string[] = []

  console.log("Seeding admin user...")
  const adminPassword = await hashPassword("admin123")
  await db.insert(users).values({
    id: generateId(),
    email: "admin@bentahub.com",
    password: adminPassword,
    fullName: "Admin User",
    role: "admin",
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date(now.getFullYear() - 1, 0, 1),
    updatedAt: now,
  })
  console.log("   - ✅ Admin account: admin@bentahub.com / admin123")

  console.log("Seeding branches...")
  for (const b of BRANCHES) {
    const id = generateId()
    branchIds.push(id)
    await db.insert(branches).values({
      id,
      name: b.name,
      location: b.location,
      capacity: b.capacity,
      isActive: true,
      createdAt: new Date(now.getFullYear() - 1, 0, 1),
      updatedAt: now,
    })
  }

  console.log("Seeding products...")
  const productIds: string[] = []
  const productPrices = new Map<string, number>()
  for (const p of PRODUCTS) {
    const id = generateId()
    productIds.push(id)
    productPrices.set(id, p.price)
    await db.insert(products).values({
      id,
      name: p.name,
      sku: p.sku,
      price: p.price.toFixed(2),
      category: p.category,
      branch: "Lourdes Main Branch",
      isActive: true,
      createdAt: new Date(now.getFullYear() - 1, 0, 1),
      updatedAt: now,
    })
  }

  console.log("Seeding inventory...")
  let inventoryCount = 0
  for (const branchId of branchIds) {
    for (let i = 0; i < PRODUCTS.length; i++) {
      const product = PRODUCTS[i]
      const pid = productIds[i]
      const isLowStock = Math.random() < 0.2
      const quantity = isLowStock
        ? Math.floor(Math.random() * 8) + 1
        : Math.floor(Math.random() * 40) + 15

      const threshold = product.category === "Frozen"
        ? 5
        : product.category === "Dairy"
          ? 8
          : product.category === "Beverages"
            ? 15
            : 10

      await db.insert(branchInventory).values({
        id: generateId(),
        branchId,
        productId: pid,
        quantity,
        lowStockThreshold: threshold,
        updatedAt: now,
      })
      inventoryCount++
    }
  }

  console.log("Seeding transactions...")
  let transactionCount = 0
  for (const branchId of branchIds) {
    const branchMultiplier =
      BRANCHES[0].name.includes("Main") ? 1.5
      : BRANCHES[1].name.includes("Second") ? 1.0
      : 0.7

    for (let month = 0; month < 12; month++) {
      const transactionsPerMonth = Math.floor((Math.random() * 15 + 20) * branchMultiplier)

      for (let t = 0; t < transactionsPerMonth; t++) {
        const day = Math.floor(Math.random() * 28) + 1
        const hour = Math.floor(Math.random() * 12) + 8
        const minute = Math.floor(Math.random() * 60)
        const amount = Math.floor(Math.random() * 800 + 50) + Math.random()

        const transactionDate = new Date(now.getFullYear(), now.getMonth() - 11 + month, day, hour, minute)

        if (transactionDate > now) continue

        const randomProductIndex = Math.floor(Math.random() * productIds.length)
        const randomProductPrice = productPrices.get(productIds[randomProductIndex]) || 50

        const itemCount = 1
        const totalAmount = randomProductPrice * itemCount

        await db.insert(transactions).values({
          id: generateId(),
          branchId,
          totalAmount: totalAmount.toFixed(2),
          paymentMethod: Math.random() < 0.6 ? "cash" : "gcash",
          status: Math.random() < 0.05 ? ("cancelled" as const) : ("completed" as const),
          createdAt: transactionDate,
        })
        transactionCount++
      }
    }
  }

  console.log(`✅ Seeded admin data:`)
  console.log(`   - 1 admin user (admin@bentahub.com / admin123)`)
  console.log(`   - ${BRANCHES.length} branches`)
  console.log(`   - ${PRODUCTS.length} products`)
  console.log(`   - ${inventoryCount} inventory records`)
  console.log(`   - ${transactionCount} transactions`)
  console.log(`\nDatabase: postgresql://postgres:postgres@localhost:5432/bentahub`)
}

seedData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
