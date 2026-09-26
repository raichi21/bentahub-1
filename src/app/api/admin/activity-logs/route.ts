import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { activityLogs } from "@/servers/schemas"
import { eq, and, gte, lte, desc, ilike, or, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"
import { extractToken, checkAdminAuth } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const action = searchParams.get("action") || undefined
    const dateFrom = searchParams.get("dateFrom") || undefined
    const dateTo = searchParams.get("dateTo") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const pageSize = parseInt(searchParams.get("pageSize") || "15", 10)

    const conditions: SQL[] = []
    if (action) conditions.push(eq(activityLogs.action, action))
    if (dateFrom)
      conditions.push(gte(activityLogs.createdAt, new Date(dateFrom)))
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      conditions.push(lte(activityLogs.createdAt, end))
    }
    if (search) {
      const q = `%${search}%`
      conditions.push(
        or(
          ilike(activityLogs.actorName, q),
          ilike(activityLogs.entityName, q),
          ilike(activityLogs.action, q)
        ) as SQL
      )
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [{ n: totalCount }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(activityLogs)
      .where(where)

    const rows = await db.query.activityLogs.findMany({
      where,
      orderBy: [desc(activityLogs.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          logs: rows.map((r) => ({
            id: r.id,
            actorName: r.actorName,
            actorRole: r.actorRole,
            action: r.action,
            entity: r.entity,
            entityId: r.entityId,
            entityName: r.entityName,
            details: r.details,
            branch: r.branch,
            createdAt: r.createdAt,
          })),
          totalCount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Activity logs GET error:", message)
    return NextResponse.json(
      { success: false, message: "An error occurred" },
      { status: 500 }
    )
  }
}
