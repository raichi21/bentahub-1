import { NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { missingEnvVars } from "@/lib/env"

export async function GET() {
  const missing = missingEnvVars()

  let dbOk = false
  try {
    const { db } = await import("@/drizzle/db")
    await db.execute(sql`SELECT 1`)
    dbOk = true
  } catch (error) {
    console.error("[health] DB check failed:", error)
  }

  const healthy = dbOk && missing.length === 0
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      db: dbOk ? "ok" : "error",
      missingEnv: missing,
    },
    { status: healthy ? 200 : 503 }
  )
}
