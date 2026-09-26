import { db } from "@/servers/db"
import { users, activityLogs } from "@/servers/schemas"
import { eq } from "drizzle-orm"
import { generateId } from "@/lib/auth-utils"

export interface ActivityLogInput {
  /** Actor user id. When absent the event is skipped silently. */
  actorId?: string
  action: string
  entity: string
  entityId?: string | null
  entityName?: string | null
  details?: Record<string, unknown>
  branch?: string | null
}

/**
 * Record a user activity log (who did what). Fire-and-forget: failures are
 * swallowed so logging can never break the main action.
 */
export function logActivity(input: ActivityLogInput): void {
  if (!input.actorId) return
  const actorId: string = input.actorId
  void (async () => {
    try {
      const actor = await db.query.users.findFirst({
        where: eq(users.id, actorId),
        columns: { fullName: true, role: true, branch: true },
      })
      await db.insert(activityLogs).values({
        id: generateId(),
        actorId,
        actorName: actor?.fullName ?? null,
        actorRole: actor?.role ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        entityName: input.entityName ?? null,
        details: (input.details ?? null) as Record<string, unknown> | null,
        branch: input.branch ?? actor?.branch ?? null,
      })
    } catch (err) {
      console.error("Activity log error:", err)
    }
  })()
}
