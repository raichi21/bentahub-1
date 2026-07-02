import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { createTransaction } from "@/features/cashier-dashboard/actions/create-transaction"

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      )
    }

    const branchName = user.branch || "Lourdes Main Branch"

    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })

    if (!branchRecord) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { items, totalAmount, paymentMethod, amountPaid, changeDue, discountPercent } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items provided" },
        { status: 400 },
      )
    }

    if (!paymentMethod || !["cash", "gcash"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 },
      )
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid total amount" },
        { status: 400 },
      )
    }

    const result = await createTransaction({
      branchId: branchRecord.id,
      items,
      totalAmount,
      paymentMethod,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Transaction completed successfully",
        data: { id: result.id, receiptNumber: result.receiptNumber },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Cashier transaction error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while processing the transaction" },
      { status: 500 },
    )
  }
}
