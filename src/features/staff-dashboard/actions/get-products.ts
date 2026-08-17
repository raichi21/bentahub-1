import { db } from "@/servers/db"
import { branchInventory, branches, inventoryBatches } from "@/servers/schemas"
import { eq, and, isNotNull, gte } from "drizzle-orm"
import type { StaffProductsData, StaffProductItem } from "@/types/staff"

interface InventoryWithProduct {
  id: string
  branchId: string
  productId: string
  quantity: number
  lowStockThreshold: number
  updatedAt: Date
  product: {
    id: string
    name: string
    description: string | null
    category: string
    price: string
    bulkPrice: string | null
    weight: string | null
    image: string | null
    stockStatus: string
    quantity: number
    branch: string
    sku: string | null
    barcode: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
}

interface InventoryBatchRecord {
  id: string
  branchInventoryId: string
  batchNumber: string | null
  quantity: number
  originalQuantity: number
  expiryDate: Date | null
  receivedDate: Date
  supplier: string | null
  createdAt: Date
  updatedAt: Date
}

function computeStockStatus(quantity: number, threshold: number): "in-stock" | "low-stock" | "out-of-stock" {
  if (quantity === 0) return "out-of-stock"
  if (quantity <= threshold) return "low-stock"
  return "in-stock"
}

function getNearestExpiry(inventoryId: string, allBatches: InventoryBatchRecord[]): string | null {
  const now = new Date()
  const futureBatches = allBatches.filter(
    (b) => b.branchInventoryId === inventoryId && b.expiryDate && new Date(b.expiryDate) > now && b.quantity > 0
  )
  if (futureBatches.length === 0) return null
  const nearest = futureBatches.reduce((prev, curr) =>
    new Date(prev.expiryDate!) < new Date(curr.expiryDate!) ? prev : curr
  )
  return nearest.expiryDate!.toISOString()
}

export async function getStaffProducts(branchName: string): Promise<StaffProductsData> {
  const branchRecord = await db.query.branches.findFirst({
    where: eq(branches.name, branchName),
  })

  if (!branchRecord) {
    throw new Error(`Branch "${branchName}" not found`)
  }

  const inventory = await db.query.branchInventory.findMany({
    where: eq(branchInventory.branchId, branchRecord.id),
    with: {
      product: true,
    },
  }) as unknown as InventoryWithProduct[]

  const inventoryIds = inventory.map((inv) => inv.id)
  const allBatches = inventoryIds.length > 0
    ? await db.query.inventoryBatches.findMany({
        where: and(
          gte(inventoryBatches.quantity, 1),
          isNotNull(inventoryBatches.expiryDate),
        ),
      }) as unknown as InventoryBatchRecord[]
    : []

  const products: StaffProductItem[] = inventory.map((inv) => {
    const stockStatus = computeStockStatus(inv.quantity, inv.lowStockThreshold)
    return {
      id: inv.product.id,
      sku: inv.product.sku ?? "",
      barcode: inv.product.barcode ?? "",
      name: inv.product.name,
      price: parseFloat(inv.product.price),
      category: inv.product.category,
      image: inv.product.image,
      stock: inv.quantity,
      reorderLevel: inv.lowStockThreshold,
      stockStatus,
      nearestExpiry: getNearestExpiry(inv.id, allBatches),
    }
  })

  const inStock = products.filter((p) => p.stockStatus === "in-stock").length
  const lowStock = products.filter((p) => p.stockStatus === "low-stock").length
  const outOfStock = products.filter((p) => p.stockStatus === "out-of-stock").length

  return {
    products,
    summary: {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
    },
  }
}
