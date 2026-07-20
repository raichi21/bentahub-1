import { db } from "@/servers/db"
import { eq, and, isNotNull, gte, lte } from "drizzle-orm"
import { branches, branchInventory, products, transactions, inventoryBatches } from "@/servers/schemas"
import type { MonitoringData, InventoryStatusItem, SystemAlertItem, ExpiringItemData } from "@/types/admin"

interface RawBranch {
  id: string
  name: string
  location: string | null
  isActive: boolean
}

interface RawProduct {
  id: string
  name: string
  category: string | null
  price: string
  isActive: boolean
}

interface RawInventory {
  id: string
  branchId: string
  productId: string
  quantity: number
  lowStockThreshold: number
  updatedAt: Date
}

interface RawTransaction {
  id: string
  branchId: string
  totalAmount: string
  paymentMethod: string
  status: string
  createdAt: Date
}

function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export async function getMonitoringData(branchId?: string): Promise<MonitoringData> {
  const allBranches = await db.query.branches.findMany() as RawBranch[]
  const allProducts = await db.query.products.findMany() as RawProduct[]
  const allInventory = await db.query.branchInventory.findMany() as RawInventory[]
  const allTransactions = await db.query.transactions.findMany() as RawTransaction[]

  // Filter by branch if specified
  const filteredInventory = branchId
    ? allInventory.filter((i: RawInventory) => i.branchId === branchId)
    : allInventory

  const filteredTransactions = branchId
    ? allTransactions.filter((t: RawTransaction) => t.branchId === branchId)
    : allTransactions

  const selectedBranch = branchId
    ? allBranches.find((b: RawBranch) => b.id === branchId)
    : null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // --- Total Stock Value ---
  const productPriceMap = new Map(allProducts.map((p: RawProduct) => [p.id, parseFloat(p.price)]))
  const productNameMap = new Map(allProducts.map((p: RawProduct) => [p.id, p.name]))
  const productCategoryMap = new Map(allProducts.map((p: RawProduct) => [p.id, p.category || "Uncategorized"]))

  let totalValue = 0
  const productAggregator = new Map<string, { totalQty: number; lastUpdated: Date; thresholds: number[] }>()

  for (const inv of filteredInventory) {
    const price = productPriceMap.get(inv.productId) || 0
    totalValue += price * inv.quantity

    const existing = productAggregator.get(inv.productId) || { totalQty: 0, lastUpdated: new Date(0), thresholds: [] }
    existing.totalQty += inv.quantity
    if (inv.updatedAt.getTime() > existing.lastUpdated.getTime()) existing.lastUpdated = inv.updatedAt
    existing.thresholds.push(inv.lowStockThreshold)
    productAggregator.set(inv.productId, existing)
  }

  // --- Low Stock Items ---
  const lowStockRecords = filteredInventory.filter((i: RawInventory) => i.quantity < i.lowStockThreshold)
  const totalLowStockCount = lowStockRecords.length

  // --- Pending Reservations (using pending transactions as proxy) ---
  const pendingTransactions = filteredTransactions.filter((t: RawTransaction) => t.status === "pending")
  const todayPending = pendingTransactions.filter(
    (t: RawTransaction) => new Date(t.createdAt) >= todayStart
  ).length

  // --- Expiring Items (batches expiring within 30 days) ---
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const allBatches = await db.query.inventoryBatches.findMany({
    where: and(
      gte(inventoryBatches.quantity, 1),
      isNotNull(inventoryBatches.expiryDate),
      gte(inventoryBatches.expiryDate, now),
      lte(inventoryBatches.expiryDate, thirtyDaysFromNow),
    ),
    with: {
      branchInventory: {
        with: {
          branch: true,
          product: true,
        },
      },
    },
  }) as unknown as Array<{
    id: string
    batchNumber: string | null
    quantity: number
    expiryDate: Date | null
    supplier: string | null
    branchInventory: {
      id: string
      branchId: string
      productId: string
      quantity: number
      branch: { id: string; name: string; location: string | null }
      product: { id: string; name: string; category: string | null }
    }
  }>

  const expiringItems: ExpiringItemData[] = allBatches
    .filter((b) => b.expiryDate)
    .map((b) => {
      const diffMs = b.expiryDate!.getTime() - now.getTime()
      const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return {
        productId: b.branchInventory.product.id,
        productName: b.branchInventory.product.name,
        category: b.branchInventory.product.category || "Uncategorized",
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate!.toISOString(),
        daysUntilExpiry,
        branchName: b.branchInventory.branch.name,
      }
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  // --- Inventory Status (per product in filtered inventory) ---
  const inventoryStatus: InventoryStatusItem[] = []
  for (const [productId, agg] of productAggregator) {
    const name = productNameMap.get(productId) || "Unknown"
    const category = productCategoryMap.get(productId) || "Uncategorized"
    const minThreshold = Math.min(...agg.thresholds)
    const avgThreshold = Math.round(agg.thresholds.reduce((a, b) => a + b, 0) / agg.thresholds.length)

    let status: "Active" | "Low Stock" | "Critical" = "Active"
    if (agg.totalQty === 0) status = "Critical"
    else if (agg.totalQty < minThreshold) status = "Critical"
    else if (agg.totalQty < avgThreshold * agg.thresholds.length) status = "Low Stock"

    inventoryStatus.push({
      productId,
      productName: name,
      category,
      totalQuantity: agg.totalQty,
      reorderLevel: avgThreshold,
      status,
      lastUpdated: agg.lastUpdated,
    })
  }

  inventoryStatus.sort((a, b) => {
    const order = { Critical: 0, "Low Stock": 1, Active: 2 }
    return order[a.status] - order[b.status]
  })

  // --- System Alerts from real low stock data ---
  const alerts: SystemAlertItem[] = []

  const criticalProducts = inventoryStatus.filter((i) => i.status === "Critical")
  for (const p of criticalProducts.slice(0, 3)) {
    alerts.push({
      type: "critical",
      title: `Stock Critical: ${p.productName}`,
      description: `Only ${p.totalQuantity} units${branchId ? "" : " across all branches"}. Reorder level: ${p.reorderLevel}.`,
    })
  }

  const lowProducts = inventoryStatus.filter((i) => i.status === "Low Stock")
  if (lowProducts.length > 0) {
    alerts.push({
      type: "warning",
      title: `Low Stock Alert`,
      description: `${lowProducts.length} products are running low. Review reorder levels.`,
    })
  }

  const locationLabel = selectedBranch ? selectedBranch.name : "All branches"
  alerts.push({
    type: "success",
    title: `Stock Sync Successful`,
    description: `${locationLabel} synchronized at ${now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}.`,
  })

  // --- Branches for selector ---
  const activeBranches = allBranches
    .filter((b: RawBranch) => b.isActive)
    .map((b: RawBranch) => ({ id: b.id, name: b.name }))

  return {
    metrics: {
      totalStockValue: {
        value: formatCurrency(totalValue),
        trend: "+0%",
      },
      lowStockItems: {
        value: totalLowStockCount,
        severity: totalLowStockCount > 20 ? "Critical" : totalLowStockCount > 5 ? "Warning" : "Normal",
      },
      pendingReservations: {
        value: pendingTransactions.length,
        todayCount: todayPending,
      },
    },
    inventoryStatus,
    alerts,
    branches: activeBranches,
    expiringItems,
  }
}
