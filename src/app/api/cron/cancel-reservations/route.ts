import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { orders, orderItems, branches } from "@/servers/schemas"
import { restoreStockIn } from "@/features/cashier-dashboard/actions/finalize-transaction"
import { notifyUser, notifyAdmins } from "@/lib/notifications"
import { eq, and, inArray, lt, isNull } from "drizzle-orm"

const AUTO_CANCEL_REASON =
  "Automatically cancelled — pickup deadline (5:00 PM) exceeded"
const CANCELLABLE_STATUSES = ["pending", "processing", "ready"] as const

/**
 * GET /api/cron/cancel-reservations
 *
 * Daily janitor: flips unpaid reservations whose 5:00 PM pickup deadline has
 * passed to `cancelled`. Pending orders are plain flips; processing/ready
 * orders that committed stock get that stock restored to the branch before
 * the flip, so inventory can never leak from an auto-cancel.
 *
 * Paid orders (`isPaid = true`, cash or GCash) are intentionally left alone —
 * money was taken, so staff should handle them manually (refund path).
 *
 * Triggered by Vercel Cron at 09:10 UTC (5:10 PM Manila). Guarded by
 * CRON_SECRET — fails closed when the secret is unset so the endpoint can
 * never run open.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const now = new Date()

    // Candidates: unpaid, past their 5 PM pickup deadline, still actionable,
    // and not soft-deleted. Completed/cancelled orders and null deadlines
    // (legacy rows) are naturally excluded.
    const matches = await db
      .select({
        id: orders.id,
        status: orders.status,
        branch: orders.branch,
        stockDeducted: orders.stockDeducted,
        userId: orders.userId,
      })
      .from(orders)
      .where(
        and(
          lt(orders.pickupDeadline, now),
          eq(orders.isPaid, false),
          inArray(orders.status, [...CANCELLABLE_STATUSES]),
          isNull(orders.deletedAt)
        )
      )

    let cancelled = 0
    let stockRestored = 0

    for (const match of matches) {
      let shouldNotify = false

      await db.transaction(async (tx) => {
        // Guarded flip: only one pass wins a given order. A second run (or a
        // concurrent run) sees status != pending/processing/ready and skips,
        // so stock can never be restored twice.
        const flipped = await tx
          .update(orders)
          .set({ status: "cancelled", cancelledReason: AUTO_CANCEL_REASON })
          .where(
            and(
              eq(orders.id, match.id),
              inArray(orders.status, [...CANCELLABLE_STATUSES]),
              eq(orders.isPaid, false)
            )
          )
          .returning({ id: orders.id })

        if (flipped.length === 0) return

        // Stock was committed only when staff confirmed the reservation.
        if (match.status !== "pending" && match.stockDeducted) {
          const branchRecord = await tx.query.branches.findFirst({
            where: eq(branches.name, match.branch),
          })
          const lines = await tx.query.orderItems.findMany({
            where: eq(orderItems.orderId, match.id),
          })

          if (branchRecord && lines.length > 0) {
            await restoreStockIn(
              tx,
              branchRecord.id,
              lines.map((l) => ({
                productId: l.productId,
                quantity: l.quantity,
              }))
            )
            stockRestored++
          }

          // Stock is back on the shelf — clear the flag to keep the invariant
          // "stockDeducted => stock is out of the branch."
          await tx
            .update(orders)
            .set({ stockDeducted: false })
            .where(eq(orders.id, match.id))
        }

        shouldNotify = true
      })

      // Notify after the transaction commits so a failed notification never
      // leaves the cancellation record inconsistent with what was reported.
      if (!shouldNotify) continue
      cancelled++
      await notifyUser(match.userId, {
        type: "order-status",
        title: "Reservation Cancelled",
        message: `Your reservation at ${match.branch} was automatically cancelled because the pickup deadline (5:00 PM) passed.`,
        relatedOrderId: match.id,
      })

      await notifyAdmins({
        type: "order-status",
        title: "Reservation Auto-Cancelled",
        message: `Order ${match.id} at ${match.branch} was automatically cancelled after passing the 5:00 PM pickup deadline.`,
        relatedOrderId: match.id,
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Auto-cancel completed",
        data: { cancelled, stockRestored },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Cron cancel-reservations error:", message)
    return NextResponse.json(
      { success: false, message: "Auto-cancel failed" },
      { status: 500 }
    )
  }
}
