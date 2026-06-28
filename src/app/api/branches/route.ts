import { db } from "@/drizzle/db"
import { branches } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { apiResponse, apiError } from "@/lib/api-response"

export async function GET() {
  try {
    const activeBranches = await db.query.branches.findMany({
      where: eq(branches.isActive, true),
      columns: { id: true, name: true, location: true, capacity: true },
    })

    return apiResponse({ success: true, data: activeBranches })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Failed to fetch branches:", message)
    return apiError("Failed to fetch branches", 500)
  }
}
