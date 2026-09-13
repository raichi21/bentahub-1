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
  process.env.DATABASE_URL =
    "postgresql://postgres:postgres@localhost:5432/bentahub"
}

const DEFAULT_UNITS = [
  "pcs",
  "kg",
  "box",
  "pack",
  "bottle",
  "dozen",
  "sack",
  "gallon",
]

const DEFAULT_CATEGORIES: { name: string; code: string }[] = [
  { name: "Grocery", code: "GRC" },
  { name: "Beverages", code: "BVG" },
  { name: "Household", code: "HOU" },
  { name: "Pharmacy", code: "PHA" },
  { name: "Snacks", code: "SNK" },
  { name: "Bakery", code: "BAK" },
]

async function run() {
  const { db } = await import("@/servers/db")
  const { unitTypes, categories, products } = await import("@/servers/schemas")
  const { generateId } = await import("@/lib/auth-utils")

  console.log("🌱 Starting BentaHub master data seed...")

  // 1. Unit types — keep existing, add missing defaults
  console.log("📦 Seeding unit types...")
  const existingUnits = await db.query.unitTypes.findMany()
  const existingUnitNames = new Set(
    existingUnits.map((u) => u.name.toLowerCase())
  )
  const unitValues = DEFAULT_UNITS.filter((u) => !existingUnitNames.has(u)).map(
    (name) => ({
      id: generateId(),
      name,
      isActive: true,
    })
  )
  if (unitValues.length > 0) {
    await db.insert(unitTypes).values(unitValues)
  }

  // 2. Categories — existing products' distinct categories + defaults
  console.log("🏷️  Seeding categories...")
  const productRows = await db
    .select({ category: products.category })
    .from(products)
  const uniqueProductCategories = new Set<string>()
  for (const row of productRows) {
    const cat = row.category?.trim()
    if (cat) uniqueProductCategories.add(cat)
  }

  const desired: { name: string; code: string }[] = [...DEFAULT_CATEGORIES]
  for (const name of uniqueProductCategories) {
    if (!desired.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      const code =
        name
          .slice(0, 4)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .padEnd(3, "X")
          .slice(0, 3) || "GEN"
      desired.push({ name, code: code === "GEN" ? "GEN" : code })
    }
  }

  const existingCategories = await db.query.categories.findMany()
  const existingCategoryNames = new Set(
    existingCategories.map((c) => c.name.toLowerCase())
  )
  const existingCategoryCodes = new Set(
    existingCategories.map((c) => c.code.toUpperCase())
  )
  const categoryValues = desired
    .filter((c) => !existingCategoryNames.has(c.name.toLowerCase()))
    .map((c) => {
      let code = c.code.toUpperCase()
      if (existingCategoryCodes.has(code)) {
        let suffix = 1
        while (existingCategoryCodes.has(`${code}${suffix}`)) suffix++
        code = `${code}${suffix}`
      }
      existingCategoryCodes.add(code)
      return { id: generateId(), name: c.name, code, isActive: true }
    })
  if (categoryValues.length > 0) {
    await db.insert(categories).values(categoryValues)
  }

  const unitCount = (await db.query.unitTypes.findMany()).length
  const categoryCount = (await db.query.categories.findMany()).length

  console.log("✅ Master data seeded successfully!")
  console.log(`\nSummary:`)
  console.log(`- Unit types: ${unitCount} (${DEFAULT_UNITS.join(", ")})`)
  console.log(`- Categories: ${categoryCount}`)
  process.exit(0)
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})
