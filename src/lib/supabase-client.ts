"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null

/**
 * Shared browser Supabase client for Realtime subscriptions.
 *
 * Uses the public anon key only — all authorization is enforced by Postgres
 * RLS policies (see `drizzle/0016_cashier_cart_realtime.sql`). Writes always
 * go through our own API routes (drizzle + pooler), never through this client.
 *
 * Returns `null` when the env vars are missing (e.g. local dev without
 * Supabase configured) — callers must treat `null` as "realtime unavailable"
 * and rely on the fallback poll.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  if (!browserClient) {
    browserClient = createClient(url, anonKey)
  }
  return browserClient
}
