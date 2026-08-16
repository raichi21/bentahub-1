import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { notificationPreferences } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromToken, generateId } from "@/lib/auth-utils"

const updateNotifPrefsSchema = z.object({
  orderUpdates: z.boolean(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })

    if (!prefs) {
      const id = generateId()
      await db.insert(notificationPreferences).values({
        id,
        userId,
        orderUpdates: true,
      })
      prefs = { id, userId, orderUpdates: true, createdAt: new Date(), updatedAt: new Date() }
    }

    return NextResponse.json({ success: true, data: prefs }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to fetch notification preferences:", message)
    return NextResponse.json({ success: false, message: "Failed to fetch preferences" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateNotifPrefsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: parsed.error.errors[0]?.message ?? "Invalid input",
      }, { status: 400 })
    }

    const { orderUpdates } = parsed.data

    const existing = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })

    if (existing) {
      await db.update(notificationPreferences)
        .set({ orderUpdates })
        .where(eq(notificationPreferences.userId, userId))
    } else {
      await db.insert(notificationPreferences).values({
        id: generateId(),
        userId,
        orderUpdates,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated",
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to update notification preferences:", message)
    return NextResponse.json({ success: false, message: "Failed to update preferences" }, { status: 500 })
  }
}
