import { NextRequest, NextResponse } from "next/server"
import { extractToken, checkRoleAuth } from "@/lib/auth-utils"
import { db } from "@/servers/db"
import { cashDrawerSessions, transactions, branches, users } from "@/servers/schemas"
import { eq, and, sql } from "drizzle-orm"
import { logAuditEvent } from "@/lib/audit-logger"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = checkRoleAuth(extractToken(request), ["cashier"], "Cashier area")
    if (auth.error) return auth.error

    const { sessionId } = await context.params

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

    const session = await db.query.cashDrawerSessions.findFirst({
      where: eq(cashDrawerSessions.id, sessionId),
    })

    if (!session) {
      return NextResponse.json({ success: false, message: "Cash drawer session not found" }, { status: 404 })
    }

    if (session.branchId !== branchRecord.id) {
      return NextResponse.json(
        { success: false, message: "This cash drawer session does not belong to your branch" },
        { status: 403 }
      )
    }

    if (session.status !== "open") {
      return NextResponse.json(
        { success: false, message: "This cash drawer session is already closed" },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsedActual = body?.actualEndingCash === undefined ? null : Number(body.actualEndingCash)

    if (parsedActual === null || !Number.isFinite(parsedActual) || parsedActual < 0) {
      return NextResponse.json(
        { success: false, message: "A valid actual ending cash count is required" },
        { status: 400 }
      )
    }

    const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : session.notes

    // expectedEndingCash = startingCash + Σ(amountPaid - change of linked cash transactions)
    const cashAgg = await db
      .select({ netCash: sql<number>`coalesce(sum(${transactions.amountPaid} - coalesce(${transactions.change}, 0)), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.sessionId, sessionId),
          eq(transactions.paymentMethod, "cash"),
          eq(transactions.status, "completed")
        )
      )

    const starting = Number(session.startingCash) || 0
    const totalNetCash = Number(cashAgg[0]?.netCash) || 0
    const expectedEndingCash = starting + totalNetCash

    await db
      .update(cashDrawerSessions)
      .set({
        closedAt: new Date(),
        closedBy: auth.userId,
        expectedEndingCash: expectedEndingCash.toFixed(2),
        actualEndingCash: parsedActual.toFixed(2),
        notes,
        status: "closed",
      })
      .where(eq(cashDrawerSessions.id, sessionId))

    const updated = await db.query.cashDrawerSessions.findFirst({
      where: eq(cashDrawerSessions.id, sessionId),
    })

    const diff = parsedActual - expectedEndingCash

    void logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      userName: user.fullName,
      userRole: user.role,
      action: "CASH_DRAWER_CLOSED",
      category: "cash_drawer",
      severity: Math.abs(diff) > 0 ? "warning" : "info",
      branchId: branchRecord.id,
      details: {
        sessionId,
        startingCash: starting.toFixed(2),
        totalNetCash: totalNetCash.toFixed(2),
        expectedEndingCash: expectedEndingCash.toFixed(2),
        actualEndingCash: parsedActual.toFixed(2),
        difference: diff.toFixed(2),
        notes,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Cash drawer session closed",
      data: { session: updated },
    })
  } catch (error) {
    console.error("Close cash drawer session error:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while closing the cash drawer session" },
      { status: 500 }
    )
  }
}
