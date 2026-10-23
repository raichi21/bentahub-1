import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuthActive } from "@/lib/auth-utils"
import { DEFAULT_BRANCH_NAME } from "@/lib/branches"
import { db } from "@/servers/db"
import { branches } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import {
  createTransaction,
  NoOpenCashDrawerError,
} from "@/features/cashier-dashboard/actions/create-transaction"

export async function POST(request: NextRequest) {
  try {
    const auth = await checkRoleAuthActive(
      extractToken(request),
      ["cashier"],
      "Cashier area"
    )

    if (auth.error) {
      return auth.error
    }

    // checkRoleAuthActive already looked the user up — reuse it instead of a
    // second users query, and run the branch lookup alongside the body parse.
    const branchName = auth.user.branch || DEFAULT_BRANCH_NAME

    const [branchRecord, body] = await Promise.all([
      db.query.branches.findFirst({
        where: eq(branches.name, branchName),
      }),
      request.json(),
    ])

    if (!branchRecord) {
      return NextResponse.json(
        { success: false, message: "Branch not found" },
        { status: 404 }
      )
    }

    const { items, totalAmount, paymentMethod, amountPaid, changeDue } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items provided" },
        { status: 400 }
      )
    }

    if (!paymentMethod || !["cash", "gcash"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      )
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid total amount" },
        { status: 400 }
      )
    }

    const result = await createTransaction({
      branchId: branchRecord.id,
      branchName,
      cashierId: auth.userId,
      items,
      totalAmount,
      paymentMethod,
      amountPaid: amountPaid !== undefined ? Number(amountPaid) : undefined,
      change: changeDue !== undefined ? Number(changeDue) : undefined,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Transaction completed successfully",
        data: { id: result.id, receiptNumber: result.receiptNumber },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof NoOpenCashDrawerError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }
    console.error("Cashier transaction error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing the transaction",
      },
      { status: 500 }
    )
  }
}
