import { db } from "@/servers/db"
import { branchInventory, branches } from "@/servers/schemas"
import { eq } from "drizzle-orm"
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
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
}

function computeStockStatus(quantity: number, threshold: number): "in-stock" | "low-stock" | "out-of-stock" {
  if (quantity === 0) return "out-of-stock"
  if (quantity <= threshold) return "low-stock"
  return "in-stock"
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

  const products: StaffProductItem[] = inventory.map((inv) => {
    const stockStatus = computeStockStatus(inv.quantity, inv.lowStockThreshold)
    return {
      id: inv.product.id,
      sku: inv.product.sku ?? "",
      name: inv.product.name,
      price: parseFloat(inv.product.price),
      category: inv.product.category,
      image: inv.product.image,
      stock: inv.quantity,
      reorderLevel: inv.lowStockThreshold,
      stockStatus,
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
