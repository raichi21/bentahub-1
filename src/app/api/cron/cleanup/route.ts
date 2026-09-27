import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import {
  mfaCodes,
  emailVerifications,
  passwordResetTokens,
  notifications,
  cartItems,
  activityLogs,
} from "@/servers/schemas"
import { lt, and, eq, sql } from "drizzle-orm"

// Retention policy (tune here, single place):
const OTP_EXPIRY_DELETE = true // expired MFA / email / reset codes go immediately
const READ_NOTIFICATION_DAYS = 30
const ABANDONED_CART_DAYS = 30
const ACTIVITY_LOG_DAYS = 90

/**
 * GET /api/cron/cleanup
 *
 * Daily janitor: deletes expired auth codes, stale notifications,
 * long-abandoned carts, and old activity logs to keep database
 * storage flat. Triggered by Vercel Cron (see vercel.json).
 *
 * Guarded by CRON_SECRET — fails closed when the secret is unset so the
 * endpoint can never run open. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` automatically for cron calls.
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
    const readCutoff = new Date(
      now.getTime() - READ_NOTIFICATION_DAYS * 24 * 60 * 60 * 1000
    )
    const cartCutoff = new Date(
      now.getTime() - ABANDONED_CART_DAYS * 24 * 60 * 60 * 1000
    )
    const logCutoff = new Date(
      now.getTime() - ACTIVITY_LOG_DAYS * 24 * 60 * 60 * 1000
    )

    const deleted: Record<string, number> = {}

    if (OTP_EXPIRY_DELETE) {
      const mfa = await db
        .delete(mfaCodes)
        .where(lt(mfaCodes.expiresAt, now))
        .returning({ id: mfaCodes.id })
      deleted.mfaCodes = mfa.length

      const email = await db
        .delete(emailVerifications)
        .where(lt(emailVerifications.expiresAt, now))
        .returning({ id: emailVerifications.id })
      deleted.emailVerifications = email.length

      const reset = await db
        .delete(passwordResetTokens)
        .where(lt(passwordResetTokens.expiresAt, now))
        .returning({ id: passwordResetTokens.id })
      deleted.passwordResetTokens = reset.length
    }

    const expiredNotifs = await db
      .delete(notifications)
      .where(lt(notifications.expiresAt, now))
      .returning({ id: notifications.id })
    const oldReadNotifs = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.isRead, true),
          lt(notifications.readAt, readCutoff)
        )
      )
      .returning({ id: notifications.id })
    deleted.notifications = expiredNotifs.length + oldReadNotifs.length

    const carts = await db
      .delete(cartItems)
      .where(lt(cartItems.updatedAt, cartCutoff))
      .returning({ id: cartItems.id })
    deleted.abandonedCarts = carts.length

    const logs = await db
      .delete(activityLogs)
      .where(lt(activityLogs.createdAt, logCutoff))
      .returning({ id: activityLogs.id })
    deleted.activityLogs = logs.length

    // Storage-facing sanity: total rows remaining per cleaned table.
    const remaining: Record<string, number> = {}
    for (const [label, table] of [
      ["mfaCodes", mfaCodes],
      ["emailVerifications", emailVerifications],
      ["passwordResetTokens", passwordResetTokens],
      ["notifications", notifications],
      ["cartItems", cartItems],
      ["activityLogs", activityLogs],
    ] as const) {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(table)
      remaining[label] = n
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cleanup completed",
        data: { deleted, remaining },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Cron cleanup error:", message)
    return NextResponse.json(
      { success: false, message: "Cleanup failed" },
      { status: 500 }
    )
  }
}
