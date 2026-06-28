import { NextResponse } from "next/server"
import { db } from "@/servers/db"
import { branches } from "@/servers/schemas"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const activeBranches = await db.query.branches.findMany({
      where: eq(branches.isActive, true),
      columns: {
        id: true,
        name: true,
        location: true,
      },
    })

    return NextResponse.json({ success: true, data: activeBranches }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to fetch branches:", message)
    return NextResponse.json(
      { success: false, message: "Failed to fetch branches" },
      { status: 500 }
    )
  }
}
