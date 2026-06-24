import { db } from "@/servers/db"
import { storeSettings } from "@/servers/schemas"
import { generateId } from "@/lib/auth-utils"
import { eq } from "drizzle-orm"
import type { StoreSettingsData } from "../types"

export async function getSettings(): Promise<StoreSettingsData> {
  const rows = await db.select().from(storeSettings).limit(1)

  if (rows.length === 0) {
    const id = generateId()
    const defaults = {
      id,
      storeName: "BentaHub",
      storeAddress: "",
      storeContact: "",
      storeEmail: "",
      taxRate: "0",
      currency: "PHP",
      businessHours: "",
      lowStockThreshold: "10",
      enableEmailAlerts: "true",
      enableLowStockAlerts: "true",
      enableOrderNotifications: "true",
      minPasswordLength: "8",
      sessionTimeout: "60",
    }
    await db.insert(storeSettings).values(defaults)
    return defaults
  }

  return rows[0]
}

export async function saveSettings(
  data: Partial<StoreSettingsData>
): Promise<StoreSettingsData> {
  const rows = await db.select({ id: storeSettings.id }).from(storeSettings).limit(1)

  if (rows.length === 0) {
    const id = generateId()
    const defaults = {
      id,
      storeName: data.storeName ?? "BentaHub",
      storeAddress: data.storeAddress ?? "",
      storeContact: data.storeContact ?? "",
      storeEmail: data.storeEmail ?? "",
      taxRate: data.taxRate ?? "0",
      currency: data.currency ?? "PHP",
      businessHours: data.businessHours ?? "",
      lowStockThreshold: data.lowStockThreshold ?? "10",
      enableEmailAlerts: data.enableEmailAlerts ?? "true",
      enableLowStockAlerts: data.enableLowStockAlerts ?? "true",
      enableOrderNotifications: data.enableOrderNotifications ?? "true",
      minPasswordLength: data.minPasswordLength ?? "8",
      sessionTimeout: data.sessionTimeout ?? "60",
    }
    await db.insert(storeSettings).values(defaults)
    return defaults
  }

  await db.update(storeSettings).set(data).where(eq(storeSettings.id, rows[0].id))

  const updated = await db.select().from(storeSettings).where(eq(storeSettings.id, rows[0].id)).limit(1)

  return updated[0]
}
