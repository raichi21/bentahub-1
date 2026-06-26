import fs from "fs"
import path from "path"
import { sql } from "drizzle-orm"

// Load .env.local before dynamically importing db
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

// Dynamic import to avoid ESM hoisting issue
const [{ db }, { branches, products, branchInventory, transactions }] = await Promise.all([
  import("../src/servers/db") as Promise<{ db: import("../src/servers/db").Database }>,
  import("../src/servers/schemas"),
])

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

const CATEGORIES = ["Coffee", "Baking Ingredients", "Condiments", "Household & Laundry Supplies", "Sauces", "Canned Goods"]

interface ProductSeed {
  name: string
  sku: string
  price: number
  bulkPrice?: number
  category: string
  weight?: string
}

const PRODUCTS: ProductSeed[] = [
  // Coffee
  { name: "Kopiko Blanca TWIN", sku: "COF-001", price: 15, bulkPrice: 135, category: "Coffee" },
  { name: "Kopiko Brown TWIN", sku: "COF-002", price: 15, bulkPrice: 135, category: "Coffee" },
  { name: "Kopiko Black TWIN", sku: "COF-003", price: 15, bulkPrice: 135, category: "Coffee" },
  { name: "Birch Tree 8g", sku: "COF-004", price: 5, category: "Coffee" },
  { name: "Birch Tree 21g", sku: "COF-005", price: 15, category: "Coffee" },
  { name: "Birch Tree 55g", sku: "COF-006", price: 32, category: "Coffee" },
  { name: "Birch Tree 150g", sku: "COF-007", price: 75, category: "Coffee" },

  // Baking Ingredients
  { name: "Graham (crushed)", sku: "BKG-001", price: 50, category: "Baking Ingredients" },
  { name: "Graham (cracker)", sku: "BKG-002", price: 45, category: "Baking Ingredients" },
  { name: "Flour (Kilo)", sku: "BKG-003", price: 35, category: "Baking Ingredients" },
  { name: "Flour (Half)", sku: "BKG-004", price: 18, category: "Baking Ingredients" },
  { name: "Flour (1/4)", sku: "BKG-005", price: 9, category: "Baking Ingredients" },
  { name: "Angel Evap 410ml", sku: "BKG-006", price: 34, category: "Baking Ingredients" },
  { name: "Angel Kremdensada 410ml", sku: "BKG-007", price: 63, category: "Baking Ingredients" },

  // Condiments
  { name: "Ajina-moto 11g", sku: "CND-001", price: 5, category: "Condiments" },
  { name: "Ajina-moto 24g", sku: "CND-002", price: 7, category: "Condiments" },
  { name: "Ajina-moto 50g", sku: "CND-003", price: 15, category: "Condiments" },
  { name: "Ajina-moto 100g", sku: "CND-004", price: 28, category: "Condiments" },
  { name: "Ajina-moto 270g", sku: "CND-005", price: 70, category: "Condiments" },
  { name: "Ajina-moto 500g", sku: "CND-006", price: 130, category: "Condiments" },
  { name: "Ajina-moto 1kg", sku: "CND-007", price: 230, category: "Condiments" },
  { name: "Cocomama gata 200ml", sku: "CND-008", price: 36, category: "Condiments" },
  { name: "Cocomama gata 400ml", sku: "CND-009", price: 70, category: "Condiments" },
  { name: "Knorr seasoning 12ml", sku: "CND-010", price: 7, category: "Condiments" },
  { name: "Knorr seasoning 130ml", sku: "CND-011", price: 70, category: "Condiments" },
  { name: "Knorr seasoning 250ml", sku: "CND-012", price: 115, category: "Condiments" },
  { name: "Knorr seasoning 250ml pouch", sku: "CND-013", price: 98, category: "Condiments" },
  { name: "Knorr seasoning 500ml", sku: "CND-014", price: 165, category: "Condiments" },
  { name: "Knorr seasoning 1L", sku: "CND-015", price: 320, category: "Condiments" },
  { name: "Magic Sarap 8g", sku: "CND-016", price: 5, category: "Condiments" },
  { name: "Magic Sarap 21g", sku: "CND-017", price: 15, category: "Condiments" },
  { name: "Magic Sarap 55g", sku: "CND-018", price: 32, category: "Condiments" },
  { name: "Magic Sarap 150g", sku: "CND-019", price: 75, category: "Condiments" },
  { name: "Datu toyo 200ml", sku: "CND-020", price: 12, category: "Condiments" },
  { name: "Datu toyo 385ml", sku: "CND-021", price: 25, category: "Condiments" },
  { name: "Datu toyo 1L", sku: "CND-022", price: 60, category: "Condiments" },
  { name: "Datu suka 200ml", sku: "CND-023", price: 10, category: "Condiments" },
  { name: "Datu suka 385ml", sku: "CND-024", price: 23, category: "Condiments" },
  { name: "Datu suka 1L", sku: "CND-025", price: 50, category: "Condiments" },

  // Household & Laundry Supplies
  { name: "Sunsilk pink 15ml", sku: "HLD-001", price: 8, bulkPrice: 80, category: "Household & Laundry Supplies" },
  { name: "Maxglow 330ml", sku: "HLD-002", price: 20, bulkPrice: 400, category: "Household & Laundry Supplies" },
  { name: "Maxglow 1L", sku: "HLD-003", price: 35, bulkPrice: 400, category: "Household & Laundry Supplies" },
  { name: "Maxglow 1.5L", sku: "HLD-004", price: 50, bulkPrice: 400, category: "Household & Laundry Supplies" },
  { name: "Maxglow 1Gallon", sku: "HLD-005", price: 135, bulkPrice: 535, category: "Household & Laundry Supplies" },
  { name: "Maxglow powder pink 1000", sku: "HLD-006", price: 42, bulkPrice: 1000, category: "Household & Laundry Supplies" },
  { name: "Maxglow powder blue 1000", sku: "HLD-007", price: 42, bulkPrice: 1000, category: "Household & Laundry Supplies" },

  // Sauces
  { name: "Tomato Sauce Original 115g", sku: "SAU-001", price: 22, category: "Sauces" },
  { name: "Tomato Sauce Original 200g", sku: "SAU-002", price: 26, category: "Sauces" },
  { name: "Tomato Sauce Original 250g", sku: "SAU-003", price: 30, category: "Sauces" },
  { name: "Tomato Sauce Original 900g", sku: "SAU-004", price: 95, category: "Sauces" },
  { name: "Delmonte party pack 1kg Filipino", sku: "SAU-005", price: 150, category: "Sauces" },
  { name: "Delmonte party pack 1kg Sweets", sku: "SAU-006", price: 150, category: "Sauces" },

  // Canned Goods
  { name: "Ligo sardines red 425g", sku: "CAN-001", price: 68, category: "Canned Goods" },
  { name: "Ligo sardines green 425g", sku: "CAN-002", price: 67, category: "Canned Goods" },
  { name: "Ligo sardines red 155g", sku: "CAN-003", price: 28, category: "Canned Goods" },
  { name: "Ligo sardines green 155g", sku: "CAN-004", price: 28, category: "Canned Goods" },
]

async function seedData(): Promise<void> {
  console.log("Clearing existing data...")
  await db.delete(transactions)
  await db.delete(branchInventory)
  await db.delete(products)
  await db.delete(branches)

  const now = new Date()
  const branchIds: string[] = []

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
  const branchNames = BRANCHES.map((b) => b.name)
  const branchSuffixes = ["MAIN", "SEC", "THIRD"]
  const productIds: string[] = []
  const productPrices = new Map<string, number>()

  for (let bi = 0; bi < branchNames.length; bi++) {
    const branchName = branchNames[bi]
    const suffix = branchSuffixes[bi]
    for (const p of PRODUCTS) {
      const id = generateId()
      productIds.push(id)
      productPrices.set(id, p.price)
      await db.insert(products).values({
        id,
        name: p.name,
        sku: `${p.sku}-${suffix}`,
        price: p.price.toFixed(2),
        bulkPrice: p.bulkPrice?.toFixed(2),
        category: p.category,
        branch: branchName,
        isActive: true,
        createdAt: new Date(now.getFullYear() - 1, 0, 1),
        updatedAt: now,
      })
    }
  }

  console.log("Seeding inventory...")
  const productsPerBranch = PRODUCTS.length
  let inventoryCount = 0
  for (let bi = 0; bi < branchIds.length; bi++) {
    const branchId = branchIds[bi]
    const offset = bi * productsPerBranch
    for (let i = 0; i < productsPerBranch; i++) {
      const product = PRODUCTS[i]
      const pid = productIds[offset + i]
      const isLowStock = Math.random() < 0.2
      const quantity = isLowStock
        ? Math.floor(Math.random() * 8) + 1
        : Math.floor(Math.random() * 40) + 15

      const threshold = product.category === "Canned Goods"
        ? 8
        : product.category === "Condiments"
          ? 12
          : product.category === "Sauces"
            ? 10
            : product.category === "Household & Laundry Supplies"
              ? 6
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

    for (let month = 0; month < 3; month++) {
      const transactionsPerMonth = Math.floor((Math.random() * 10 + 5) * branchMultiplier)

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
  console.log(`   - ${BRANCHES.length} branches`)
  console.log(`   - ${PRODUCTS.length} products per branch (${PRODUCTS.length * BRANCHES.length} total)`)
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
