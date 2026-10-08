"use client"

import { useMemo } from "react"
import { useRealtimeTable } from "./use-realtime"

/**
 * Subscribe to the cashier's cart via Supabase Realtime (Postgres Changes on
 * `cashier_cart_items`) and invoke `callback` on every change. Pass `null`
 * token/userId to disconnect. See `useRealtimeTable` for behavior details.
 */
export function useCartStream(
  callback: () => void,
  token: string | null,
  userId: string | null
): void {
  const subscription = useMemo(
    () =>
      userId
        ? {
            topic: `cart:${userId}`,
            table: "cashier_cart_items",
            filter: `user_id=eq.${userId}`,
          }
        : null,
    [userId]
  )
  useRealtimeTable(callback, token, subscription)
}
