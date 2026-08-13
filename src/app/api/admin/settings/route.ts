import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/servers/db"
import { storeSettings } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { verifyToken, extractToken, checkAdminAuth } from "@/lib/auth-utils"

const DEFAULT_SETTINGS_ID = "default"

const updateSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required").max(255),
  logo: z.string().max(3_000_000).nullable().optional(),
  storeAddress: z.string().max(255).nullable().optional(),
  storeContact: z.string().max(50).nullable().optional(),
  storeEmail: z.string().max(255).nullable().optional(),
})

function defaultSettings() {
  return {
    id: DEFAULT_SETTINGS_ID,
    storeName: "BentaHub",
    logo: null,
    storeAddress: null,
    storeContact: null,
    storeEmail: null,
    updatedAt: null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request)
    if (!token) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    if (payload.role !== "admin") return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })

    const existing = await db.query.storeSettings.findFirst({
      where: eq(storeSettings.id, DEFAULT_SETTINGS_ID),
    })

    return NextResponse.json({ success: true, data: existing ?? defaultSettings() }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Settings GET error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = checkAdminAuth(extractToken(request))
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: parsed.error.errors[0]?.message ?? "Invalid input",
      }, { status: 400 })
    }

    const { storeName, logo, storeAddress, storeContact, storeEmail } = parsed.data

    await db.insert(storeSettings)
      .values({
        id: DEFAULT_SETTINGS_ID,
        storeName,
        logo: logo ?? null,
        storeAddress: storeAddress ?? null,
        storeContact: storeContact ?? null,
        storeEmail: storeEmail ?? null,
      })
      .onConflictDoUpdate({
        target: storeSettings.id,
        set: {
          storeName,
          logo: logo ?? null,
          storeAddress: storeAddress ?? null,
          storeContact: storeContact ?? null,
          storeEmail: storeEmail ?? null,
        },
      })

    return NextResponse.json({ success: true, message: "Settings saved successfully" }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Settings PUT error:", message)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}
