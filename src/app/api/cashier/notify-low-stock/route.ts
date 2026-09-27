import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users } from "@/servers/schemas"
import { eq, and } from "drizzle-orm"
import { notifyUser, notifyAdmins } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const auth = checkRoleAuth(
      extractToken(request),
      ["cashier"],
      "Cashier area"
    )
    if (auth.error) {
      return auth.error
    }

    const cashier = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })

    if (!cashier) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { productId, productName, sku } = body

    if (!productId || !productName || !sku) {
      return NextResponse.json(
        { success: false, message: "Missing product details" },
        { status: 400 }
      )
    }

    const branch = cashier.branch
    if (!branch) {
      return NextResponse.json(
        { success: false, message: "Cashier has no assigned branch" },
        { status: 400 }
      )
    }

const staffUsers = await db.query.users.findMany({
    where: and(
      eq(users.role, "staff"),
      eq(users.branch, branch),
      eq(users.isActive, true)
    ),
  })

  if (staffUsers.length === 0) {
    return NextResponse.json(
      { success: false, message: "No staff users found in your branch" },
      { status: 404 }
    )
  }

  const payload = {
    type: "low-stock" as const,
    title: `Low Stock Alert: ${productName}`,
    message: `${productName} (SKU: ${sku}) at ${branch} is running low on stock. Raised by cashier ${cashier.fullName}.`,
    relatedProductId: productId,
  }

  let notifiedCount = 0
  for (const staff of staffUsers) {
    if (await notifyUser(staff.id, payload)) notifiedCount++
  }
  notifiedCount += await notifyAdmins(payload)

  return NextResponse.json({
    success: true,
    message: `${notifiedCount} user${notifiedCount > 1 ? "s" : ""} notified about ${productName}`,
  })
  } catch (error) {
    console.error("Notify low stock error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while creating low stock notification",
      },
      { status: 500 }
    )
  }
}
