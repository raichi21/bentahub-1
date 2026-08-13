import { db } from "@/drizzle/db"
import { storeSettings } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

const PUBLIC_SETTINGS_ID = "default"

export async function GET() {
  try {
    const settings = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.id, PUBLIC_SETTINGS_ID),
    })

    const data = {
      storeName: settings?.storeName ?? "BentaHub",
      logo: settings?.logo ?? null,
    }

    return apiResponse({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to fetch settings:", message)
    return apiError("Failed to fetch settings", 500)
  }
}
