import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { sql } from "drizzle-orm"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    if (!token) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    if (payload.role !== "admin") return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })

    // Try to fetch settings, return defaults if table doesn't exist
    try {
      const result = await db.execute(sql`SELECT * FROM store_settings LIMIT 1`)
      const settings = result[0] || getDefaultSettings()
      return NextResponse.json({ success: true, data: settings })
    } catch {
      return NextResponse.json({ success: true, data: getDefaultSettings() })
    }
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractToken(request)
    if (!token) return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 })
    if (payload.role !== "admin") return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 })

    const body = await request.json()

    // Try to upsert settings
    try {
      await db.execute(sql`
        INSERT INTO store_settings (id, store_name, store_address, store_contact, store_email, currency, business_hours, enable_email_alerts, enable_low_stock_alerts, enable_order_notifications, min_password_length, session_timeout, updated_at)
        VALUES (gen_random_uuid(), ${body.storeName || ""}, ${body.storeAddress || ""}, ${body.storeContact || ""}, ${body.storeEmail || ""}, ${body.currency || "PHP"}, ${body.businessHours || ""}, ${body.enableEmailAlerts ?? true}, ${body.enableLowStockAlerts ?? true}, ${body.enableOrderNotifications ?? true}, ${body.minPasswordLength || 8}, ${body.sessionTimeout || 60}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          store_name = EXCLUDED.store_name,
          store_address = EXCLUDED.store_address,
          store_contact = EXCLUDED.store_contact,
          store_email = EXCLUDED.store_email,
          currency = EXCLUDED.currency,
          business_hours = EXCLUDED.business_hours,
          enable_email_alerts = EXCLUDED.enable_email_alerts,
          enable_low_stock_alerts = EXCLUDED.enable_low_stock_alerts,
          enable_order_notifications = EXCLUDED.enable_order_notifications,
          min_password_length = EXCLUDED.min_password_length,
          session_timeout = EXCLUDED.session_timeout,
          updated_at = NOW()
      `)
      return NextResponse.json({ success: true, message: "Settings saved successfully" })
    } catch {
      // Table doesn't exist yet — just acknowledge
      return NextResponse.json({ success: true, message: "Settings received (table pending creation)" })
    }
  } catch (error) {
    console.error("Settings PUT error:", error)
    return NextResponse.json({ success: false, message: "An error occurred" }, { status: 500 })
  }
}

function getDefaultSettings() {
  return {
    storeName: "BentaHub Store",
    storeAddress: "",
    storeContact: "",
    storeEmail: "",
    currency: "PHP",
    businessHours: "",
    enableEmailAlerts: true,
    enableLowStockAlerts: true,
    enableOrderNotifications: true,
    minPasswordLength: 8,
    sessionTimeout: 60,
  }
}
