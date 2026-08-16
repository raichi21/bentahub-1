import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { users, notificationPreferences } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromToken } from "@/lib/auth-utils"

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(255),
  phone: z.string().max(20).nullable().optional(),
  image: z.string().max(3_000_000).nullable().optional(),
  branch: z.string().max(50).nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        image: true,
        branch: true,
        role: true,
        isEmailVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    })

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        notificationPreferences: prefs ?? { orderUpdates: true },
      },
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to fetch profile:", message)
    return NextResponse.json({ success: false, message: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        message: parsed.error.errors[0]?.message ?? "Invalid input",
      }, { status: 400 })
    }

    const { fullName, phone, image, branch } = parsed.data

    const updateData: Partial<typeof users.$inferInsert> = {
      fullName,
      phone: phone ?? null,
    }
    if (image !== undefined) {
      updateData.image = image
    }
    if (branch !== undefined) {
      updateData.branch = branch
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))

    const responseData: Record<string, string | null> = { userId, fullName, phone: phone ?? null }
    if (image !== undefined) {
      responseData.image = image
    }
    if (branch !== undefined) {
      responseData.branch = branch
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: responseData,
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to update profile:", message)
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 })
  }
}
