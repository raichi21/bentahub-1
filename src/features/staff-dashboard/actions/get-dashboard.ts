import { db } from "@/servers/db"
import { branchInventory, transactions, orders, branches } from "@/servers/schemas"
import { eq, and, gte, sql } from "drizzle-orm"
import type { StaffDashboardData } from "@/types/staff"

interface RawBranchInventory {
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

interface RawOrder {
  id: string
  userId: string
  status: string
  paymentMethod: string
  totalAmount: string
  branch: string
  notes: string | null
  isPaid: boolean
  paidAt: Date | null
  pickupDeadline: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getStaffDashboard(branchName: string): Promise<StaffDashboardData> {
  const branchRecord = await db.query.branches.findFirst({
    where: eq(branches.name, branchName),
  })

  if (!branchRecord) {
    throw new Error(`Branch "${branchName}" not found`)
  }

  const branchId = branchRecord.id

  // Stock is authoritative in branch_inventory — products.stockStatus / products.branch
  // are legacy denormalized columns that go stale. Compute all KPIs from inventory.
  const allInventory = await db.query.branchInventory.findMany({
    where: eq(branchInventory.branchId, branchId),
  }) as RawBranchInventory[]

  const totalProducts = allInventory.length
  const inStockCount = allInventory.filter(
    (i) => i.quantity >= i.lowStockThreshold
  ).length
  const lowStockCount = allInventory.filter(
    (i) => i.quantity < i.lowStockThreshold
  ).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const allTransactions = await db.query.transactions.findMany({
    where: and(
      eq(transactions.branchId, branchId),
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, today),
    ),
  }) as RawTransaction[]

  const todayRevenue = allTransactions.reduce(
    (sum, t) => sum + parseFloat(t.totalAmount),
    0,
  )

  const allOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.branch, branchName),
      eq(orders.isPaid, true),
      sql`${orders.status} IN ('pending', 'processing', 'ready')`,
    ),
  }) as RawOrder[]

  const pendingPickups = allOrders.length

  return {
    kpis: {
      totalProducts,
      totalProductsSubtext: `${inStockCount} in stock`,
      lowStockCount,
      pendingPickups,
      todayRevenue,
    },
  }
}
