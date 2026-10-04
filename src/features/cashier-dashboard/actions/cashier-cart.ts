import { db } from "@/servers/db"
import {
  cashierCartItems,
  products,
  branches,
  branchInventory,
} from "@/servers/schemas"
import { eq, and, inArray, sql } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"
import type { Product } from "@/types/cashier"

/**
 * Line of the cashier's active POS cart. Same shape the cashier UI already
 * uses (`CartItem` from `@/types/cashier`), so the synced endpoint can be
 * dropped straight into the existing `<CartSidebar>`/`<CartItem>` renderers.
 */
export interface CashierCartLine {
  product: Product
  quantity: number
}

/** Server-side cart shape returned by every /api/cashier/cart response. */
export interface CashierCartData {
  items: CashierCartLine[]
  itemCount: number
  total: number
}

// ─────────────────────────────────────────────────────────────────────
// Pure decision helpers (unit-tested in cashier-cart.test.ts)
// ─────────────────────────────────────────────────────────────────────

/**
 * Decide whether a scan/click can add one more unit of a product.
 * A product is addable only when it has stock AND the cart line is not
 * already holding every unit.
 */
export function resolveAddQuantity(
  existing: number,
  stock: number
): { ok: true; quantity: number } | { ok: false } {
  if (!Number.isFinite(stock) || stock <= 0) return { ok: false }
  if (existing >= stock) return { ok: false }
  return { ok: true, quantity: existing + 1 }
}

export type SetQuantityResolution =
  | { action: "set"; quantity: number }
  | { action: "remove" }
  | { action: "reject" }

/**
 * Decide what a quantity edit means against the available stock:
 *  - requested <= 0  -> remove the line
 *  - no stock left   -> remove the line (nothing sellable remains)
 *  - over available  -> clamp to the stock ceiling
 */
export function resolveSetQuantity(
  quantity: number,
  stock: number
): SetQuantityResolution {
  if (!Number.isFinite(quantity)) return { action: "reject" }
  if (quantity <= 0) return { action: "remove" }
  const available = Math.max(0, Number.isFinite(stock) ? stock : 0)
  if (available <= 0) return { action: "remove" }
  return { action: "set", quantity: Math.min(quantity, available) }
}

/**
 * Totals for a set of cart lines. Mirror of the numeric rollups the old
 * local-only cart computed per render.
 */
export function computeCartTotals(lines: CashierCartLine[]): {
  itemCount: number
  total: number
} {
  let itemCount = 0
  let total = 0
  for (const line of lines) {
    itemCount += line.quantity
    total += line.product.price * line.quantity
  }
  return { itemCount, total: Math.round(total * 100) / 100 }
}

// ─────────────────────────────────────────────────────────────────────
// DB-backed cart operations
// ─────────────────────────────────────────────────────────────────────

interface RawProductRow {
  id: string
  sku: string | null
  barcode: string | null
  name: string
  price: string
  category: string
  image: string | null
  unit: string
  quantity: number
  sellByPack: boolean
  packSize: number | null
  packPrice: string | null
}

/** Live stock + reorder threshold for a product at the cashier's branch. */
export interface StockInfo {
  quantity: number
  lowStockThreshold: number
}

/** Map a product row + branch inventory into the cashier `Product` shape. */
export function mapToCashierProduct(
  p: RawProductRow,
  stock?: StockInfo
): Product {
  return {
    id: p.id,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    name: p.name,
    price: Number(p.price),
    category: p.category as Product["category"],
    stock: stock?.quantity ?? p.quantity ?? 0,
    reorderLevel: stock?.lowStockThreshold ?? 10,
    image: p.image ?? "",
    unit: p.unit || "pcs",
    nearestExpiry: null,
    sellByPack: p.sellByPack ?? false,
    packSize: p.packSize ?? 1,
    packPrice:
      p.packPrice !== null && p.packPrice !== undefined
        ? Number(p.packPrice)
        : undefined,
  }
}

async function getBranchByName(branchName: string) {
  return db.query.branches.findFirst({ where: eq(branches.name, branchName) })
}

/** Readable stock a product has at the cashier's branch (products.quantity is
 *  a stale legacy field, so the branch inventory wins). */
async function getAvailableStock(
  branchName: string,
  productId: string
): Promise<number | null> {
  const branch = await getBranchByName(branchName)
  if (!branch) return null
  const inv = await db.query.branchInventory.findFirst({
    where: and(
      eq(branchInventory.branchId, branch.id),
      eq(branchInventory.productId, productId)
    ),
  })
  return inv?.quantity ?? 0
}

/** Full cart for a cashier, products enriched with their branch stock. */
export async function getCashierCart(
  userId: string,
  branchName: string
): Promise<CashierCartLine[]> {
  const lines = await db.query.cashierCartItems.findMany({
    where: eq(cashierCartItems.userId, userId),
    with: { product: true },
    orderBy: (cart, { asc }) => [asc(cart.createdAt)],
  })

  if (lines.length === 0) return []

  const branch = await getBranchByName(branchName)
  let stockByProduct = new Map<string, StockInfo>()
  if (branch) {
    const inventory = await db.query.branchInventory.findMany({
      where: and(
        eq(branchInventory.branchId, branch.id),
        inArray(
          branchInventory.productId,
          lines.map((l) => l.productId)
        )
      ),
    })
    stockByProduct = new Map(
      inventory.map((i) => [
        i.productId,
        { quantity: i.quantity, lowStockThreshold: i.lowStockThreshold },
      ])
    )
  }

  return lines.map((line) => ({
    product: mapToCashierProduct(
      line.product as unknown as RawProductRow,
      stockByProduct.get(line.productId)
    ),
    quantity: line.quantity,
  }))
}

export type CartAddResult =
  | { ok: true; data: CashierCartData }
  | {
      ok: false
      reason: "product-not-found" | "not-available" | "out-of-stock"
    }

/**
 * Add one unit of a product to the cashier's cart.
 * The upsert increments atomically on `(user_id, product_id)`, so two devices
 * (e.g. a phone scanner + the register) adding the same code concurrently fold
 * into one line instead of duplicating it.
 */
export async function addCashierCartItem(
  userId: string,
  productId: string,
  branchName: string
): Promise<CartAddResult> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })
  if (!product) return { ok: false, reason: "product-not-found" }
  if (product.isActive === false) return { ok: false, reason: "not-available" }

  const stock = await getAvailableStock(branchName, productId)
  const existing = await db.query.cashierCartItems.findFirst({
    where: and(
      eq(cashierCartItems.userId, userId),
      eq(cashierCartItems.productId, productId)
    ),
  })
  const existingQuantity = existing?.quantity ?? 0

  const resolved = resolveAddQuantity(existingQuantity, stock ?? 0)
  if (!resolved.ok) return { ok: false, reason: "out-of-stock" }

  await db
    .insert(cashierCartItems)
    .values({
      id: generateId(),
      userId,
      productId,
      quantity: resolved.quantity,
    })
    .onConflictDoUpdate({
      target: [cashierCartItems.userId, cashierCartItems.productId],
      set: {
        quantity: sql`${cashierCartItems.quantity} + 1`,
        updatedAt: new Date(),
      },
    })

  const items = await getCashierCart(userId, branchName)
  return { ok: true, data: toCartData(items) }
}

export type CartSetResult =
  | { ok: true; data: CashierCartData }
  | { ok: false; reason: "invalid" }

/** Set an exact quantity for a cart line, clamping to the branch stock. */
export async function setCashierCartQuantity(
  userId: string,
  productId: string,
  branchName: string,
  quantity: number
): Promise<CartSetResult> {
  const line = await db.query.cashierCartItems.findFirst({
    where: and(
      eq(cashierCartItems.userId, userId),
      eq(cashierCartItems.productId, productId)
    ),
  })

  if (!line) {
    const items = await getCashierCart(userId, branchName)
    return { ok: true, data: toCartData(items) }
  }

  const stock = (await getAvailableStock(branchName, productId)) ?? 0
  const resolved = resolveSetQuantity(quantity, stock)
  if (resolved.action === "reject") return { ok: false, reason: "invalid" }

  if (resolved.action === "remove") {
    await db
      .delete(cashierCartItems)
      .where(
        and(
          eq(cashierCartItems.userId, userId),
          eq(cashierCartItems.productId, productId)
        )
      )
  } else {
    await db
      .update(cashierCartItems)
      .set({ quantity: resolved.quantity, updatedAt: new Date() })
      .where(
        and(
          eq(cashierCartItems.userId, userId),
          eq(cashierCartItems.productId, productId)
        )
      )
  }

  const items = await getCashierCart(userId, branchName)
  return { ok: true, data: toCartData(items) }
}

/** Remove a single line from the cashier's cart. */
export async function removeCashierCartItem(
  userId: string,
  productId: string
): Promise<void> {
  await db
    .delete(cashierCartItems)
    .where(
      and(
        eq(cashierCartItems.userId, userId),
        eq(cashierCartItems.productId, productId)
      )
    )
}

/** Clear the entire cashier cart (CANCEL ORDER / after a completed sale). */
export async function clearCashierCart(userId: string): Promise<void> {
  await db.delete(cashierCartItems).where(eq(cashierCartItems.userId, userId))
}

export function toCartData(items: CashierCartLine[]): CashierCartData {
  const totals = computeCartTotals(items)
  return { items, itemCount: totals.itemCount, total: totals.total }
}
