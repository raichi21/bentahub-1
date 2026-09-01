import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth, generateId } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { cashDrawerSessions, branches, users, transactions } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["cashier"], "Cashier area")
    if (auth.error) return auth.error

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })

    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const openSession = await db.query.cashDrawerSessions.findFirst({
      where: and(
        eq(cashDrawerSessions.cashierId, auth.userId),
        eq(cashDrawerSessions.branchId, branchRecord.id),
        eq(cashDrawerSessions.status, "open")
      ),
    })

    let sessionPayload = openSession ?? null
    if (openSession) {
      const netAgg = await db
        .select({ netCash: sql<number>`coalesce(sum(${transactions.amountPaid} - coalesce(${transactions.change}, 0)), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.sessionId, openSession.id),
            eq(transactions.paymentMethod, "cash"),
            eq(transactions.status, "completed")
          )
        )
      const netCash = Number(netAgg[0]?.netCash) || 0
      const expected = (Number(openSession.startingCash) || 0) + netCash
      sessionPayload = { ...openSession, expectedEndingCash: expected.toFixed(2) }
    }

    const lastClosed = await db.query.cashDrawerSessions.findFirst({
      where: and(
        eq(cashDrawerSessions.branchId, branchRecord.id),
        eq(cashDrawerSessions.status, "closed")
      ),
      orderBy: (sessions, { desc }) => [desc(sessions.closedAt), desc(sessions.createdAt)],
      with: {
        cashier: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    const lastClosedSession = lastClosed
      ? {
          id: lastClosed.id,
          actualEndingCash: lastClosed.actualEndingCash,
          expectedEndingCash: lastClosed.expectedEndingCash,
          startingCash: lastClosed.startingCash,
          closedAt: lastClosed.closedAt ? lastClosed.closedAt.toISOString() : null,
          notes: lastClosed.notes,
          cashierName: lastClosed.cashier?.fullName ?? null,
        }
      : null

    return NextResponse.json({
      success: true,
      data: {
        session: sessionPayload,
        lastClosedSession,
      },
    })
  } catch (error) {
    console.error("Get cash drawer session error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching the cash drawer session" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["cashier"], "Cashier area")
    if (auth.error) return auth.error

    const user = await db.query.users.findFirst({
      where: eq(users.id, auth.userId),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const branchName = user.branch || "Lourdes Main Branch"
    const branchRecord = await db.query.branches.findFirst({
      where: eq(branches.name, branchName),
    })

    if (!branchRecord) {
      return NextResponse.json({ success: false, message: "Branch not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsedStartingCash = Number(body?.startingCash)

    if (body?.startingCash === undefined || !Number.isFinite(parsedStartingCash) || parsedStartingCash < 0) {
      return NextResponse.json(
        { success: false, message: "A valid starting cash float is required" },
        { status: 400 }
      )
    }

    const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null

    const existingOpen = await db.query.cashDrawerSessions.findFirst({
      where: and(
        eq(cashDrawerSessions.cashierId, auth.userId),
        eq(cashDrawerSessions.branchId, branchRecord.id),
        eq(cashDrawerSessions.status, "open")
      ),
    })

    if (existingOpen) {
      return NextResponse.json(
        { success: false, message: "You already have an open cash drawer session. Close it before opening a new one." },
        { status: 409 }
      )
    }

    const sessionId = generateId()

    await db.insert(cashDrawerSessions).values({
      id: sessionId,
      branchId: branchRecord.id,
      cashierId: auth.userId,
      startingCash: parsedStartingCash.toFixed(2),
      status: "open",
      notes,
    })

    const created = await db.query.cashDrawerSessions.findFirst({
      where: eq(cashDrawerSessions.id, sessionId),
    })

    return NextResponse.json(
      {
        success: true,
        message: "Cash drawer session opened",
        data: { session: created },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Open cash drawer session error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while opening the cash drawer session" },
      { status: 500 }
    )
  }
}
