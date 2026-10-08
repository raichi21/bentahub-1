-- ============================================================================
-- BentaHub Phase 2: Supabase Realtime for the cashier cart
-- ============================================================================
-- RUN THIS MANUALLY in Supabase Dashboard → SQL Editor (or via psql against
-- the DIRECT connection, not the pooler).
--
-- ⚠️  DO NOT RUN before completing Step 0 verification:
--   1. Confirm DATABASE_URL (Vercel env) uses the `postgres` owner role or
--      `service_role`. Both bypass RLS, so enabling RLS below cannot break
--      existing app traffic. If DATABASE_URL uses a restricted role, STOP —
--      enabling RLS will break the app.
--   2. Confirm Realtime is enabled on the project
--      (Dashboard → Database → Replication → `supabase_realtime` exists).
--
-- This script is IDEMPOTENT — safe to run more than once.
-- ============================================================================

-- Step 0 check (run first, read the results):
--   Shows which role YOU are running this script as. Expect `postgres` or
--   `service_role`. These bypass RLS, so the existing drizzle/pooler traffic
--   keeps working after RLS is enabled.
SELECT current_user AS running_as;

-- Full row payload on UPDATE/DELETE realtime events (needed so the client
-- can tell which cashier's row changed without an extra fetch filter).
ALTER TABLE cashier_cart_items REPLICA IDENTITY FULL;

-- Add the table to the Realtime publication (skip if already a member).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'cashier_cart_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cashier_cart_items;
  END IF;
END $$;

-- Enable RLS. Table owner (`postgres`) and `service_role` bypass RLS, so
-- the app's drizzle/pooler queries are unaffected. Only anon/authenticated
-- (i.e. the browser Realtime client) are subject to the policy below.
ALTER TABLE cashier_cart_items ENABLE ROW LEVEL SECURITY;

-- Each cashier sees only their own rows. Our app uses a custom JWT (not
-- Supabase Auth), so the policy reads the `userId` claim directly instead
-- of `auth.uid()`. The browser client sets this JWT via `realtime.setAuth()`.
DROP POLICY IF EXISTS cashier_cart_own_rows ON cashier_cart_items;
CREATE POLICY cashier_cart_own_rows ON cashier_cart_items
  FOR ALL TO anon, authenticated
  USING (user_id = (auth.jwt() ->> 'userId'))
  WITH CHECK (user_id = (auth.jwt() ->> 'userId'));

-- Read-only for the browser key: SELECT is needed for the realtime socket
-- to deliver events. NO insert/update/delete grant — writes stay exclusively
-- in our API routes (drizzle + pooler + custom JWT auth).
GRANT SELECT ON cashier_cart_items TO anon, authenticated;

-- Post-run verification (expect 1 row each):
SELECT tablename FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime' AND tablename = 'cashier_cart_items';
SELECT policyname, roles, cmd FROM pg_policies
  WHERE tablename = 'cashier_cart_items';
