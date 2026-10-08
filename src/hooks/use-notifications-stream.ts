"use client"

import { useMemo } from "react"
import { useRealtimeTable } from "./use-realtime"

/**
 * Subscribe to one user's notifications via Supabase Realtime (Postgres
 * Changes on the shared `notifications` table) and invoke `callback` on every
 * change — new notification, read-state flip, or clear. Pass `null`
 * token/userId to disconnect. See `useRealtimeTable` for behavior details.
 *
 * Role-agnostic: staff, admin, and customer hooks can all share this (rows
 * are per-user; the `notifications_own_rows` RLS policy enforces isolation).
 */
export function useNotificationsStream(
  callback: () => void,
  token: string | null,
  userId: string | null
): void {
  const subscription = useMemo(
    () =>
      userId
        ? {
            topic: `notifications:${userId}`,
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          }
        : null,
    [userId]
  )
  useRealtimeTable(callback, token, subscription)
}
