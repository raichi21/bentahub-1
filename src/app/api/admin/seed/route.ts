import { NextRequest, NextResponse } from "next/server"
import { db } from "@/servers/db"
import { branches } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId, extractToken, checkAdminAuth } from "@/lib/auth-utils"

/**
 * POST /api/admin/seed
 * Ensures the store's branches exist in the database (find-or-create).
 * Products, inventory, and transactions are managed manually via the admin
 * panel — no demo data is seeded.
 * Authenticated (admin) + blocked in production.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Authorize: admin only ──
    const token = extractToken(request)
    const auth = checkAdminAuth(token)
    if (auth.error) return auth.error

    // ── Production guard: seeding is dev-only ──
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Seeding is disabled in production" },
        { status: 403 }
      )
    }

    // ── Delete legacy "Main Branch" if it still exists ──
    await db.delete(branches).where(eq(branches.name, "Main Branch"))

    // ── Find or create the store branches ──
    const branchNames = [
      { name: "Lourdes Main Branch", location: "C. De Guzman St., Hortaleza, Poblacion, Santa Maria, Bulacan", capacity: 500 },
      { name: "Lourdes Second Branch", location: "C. De Guzman St., Hortaleza, Poblacion, Santa Maria, Bulacan", capacity: 400 },
      { name: "Lourdes Third Branch", location: "C. De Guzman St., Hortaleza, Poblacion, Santa Maria, Bulacan", capacity: 400 },
    ]

    const branchIds: string[] = []

    for (const b of branchNames) {
      const existing = await db.query.branches.findFirst({
        where: eq(branches.name, b.name),
      })

      if (existing) {
        await db.update(branches)
          .set({ location: b.location, capacity: b.capacity })
          .where(eq(branches.id, existing.id))
        branchIds.push(existing.id)
      } else {
        const id = generateId()
        await db.insert(branches).values({
          id,
          name: b.name,
          location: b.location,
          capacity: b.capacity,
          isActive: true,
        })
        branchIds.push(id)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `✅ Successfully ensured ${branchIds.length} branches. Products and inventory are managed manually via admin.`,
        count: branchIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error seeding branches:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed branches",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
