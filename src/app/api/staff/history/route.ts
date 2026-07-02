import { NextRequest, NextResponse } from "next/server"
import { verifyToken, extractToken } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { users, branches, transactions } from "@/servers/schemas"
import { eq, desc } from "drizzle-orm"
import type { Transaction } from "@/types/cashier"

interface RawTransactionItem {
  id: string
  transactionId: string
  productId: string
  productName: string
  quantity: number
  price: string
  subtotal: string
  createdAt: Date
}

interface RawTransaction {
  id: string
  branchId: string
  totalAmount: string
  paymentMethod: "cash" | "gcash"
  status: "completed" | "pending" | "cancelled"
  createdAt: Date
  items: RawTransactionItem[]
}

export async function GET(request: NextRequest) {
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

    const allTransactions = await db.query.transactions.findMany({
      where: eq(transactions.branchId, branchRecord.id),
      orderBy: desc(transactions.createdAt),
      with: {
        items: true,
      },
    }) as unknown as RawTransaction[]

    const mapped: Transaction[] = allTransactions.map((t) => {
      const items = (t.items || []).map((item) => ({
        productId: item.productId,
        name: item.productName,
        qty: item.quantity,
        price: parseFloat(item.price),
      }))

      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
      const total = parseFloat(t.totalAmount)

      return {
        id: t.id,
        date: t.createdAt.toISOString(),
        items,
        subtotal,
        discount: Math.max(0, subtotal - total),
        total,
        paymentMethod: t.paymentMethod,
        amountPaid: total,
        change: 0,
        cashier: payload.fullName || "Cashier",
        status: t.status === "cancelled" ? "cancelled" : "completed",
      }
    })

    return NextResponse.json(
      { success: true, message: "History retrieved successfully", data: mapped },
      { status: 200 },
    )
  } catch (error) {
    console.error("Staff history error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching history" },
      { status: 500 },
    )
  }
}
