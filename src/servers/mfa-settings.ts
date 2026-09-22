import { db } from "@/servers/db"
import { storeSettings } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { isMfaEnforced } from "@/lib/mfa"

const DEFAULT_SETTINGS_ID = "default"

/**
 * Whether MFA challenges are currently required: production builds require
 * them unless the admin has explicitly switched the flag off in Admin
 * Settings (store_settings.mfa_required). A missing row / null flag
 * preserves the previous default (required).
 */
export async function isMfaRequiredGlobally(): Promise<boolean> {
  if (!isMfaEnforced()) return false
  try {
    const s = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.id, DEFAULT_SETTINGS_ID),
    })
    return s?.mfaRequired ?? true
  } catch {
    return true
  }
}
