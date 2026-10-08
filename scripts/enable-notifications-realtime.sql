-- ============================================================================
-- BentaHub Phase 2 (wave 2): Supabase Realtime for notifications
-- ============================================================================
-- RUN THIS MANUALLY in Supabase Dashboard → SQL Editor (or via psql against
-- the DIRECT connection, not the pooler).
--
-- ⚠️  SAME PRECONDITION as scripts/enable-cart-realtime.sql:
--   Confirm DATABASE_URL uses the `postgres` owner role or `service_role`
--   (both bypass RLS). If it uses a restricted role, STOP — enabling RLS
--   will break the app.
--
-- Covers the shared `notifications` table used by staff, admin, AND customer
-- notification endpoints (all rows are per-user via `user_id`), so this one
-- migration unblocks realtime for all three roles. Client hooks adopt it
-- one role at a time (staff first).
--
-- This script is IDEMPOTENT — safe to run more than once.
-- ============================================================================

SELECT current_user AS running_as;

-- Full row payload on UPDATE/DELETE events (is_read flips must carry user_id
-- so other devices can sync read state without an extra fetch).
ALTER TABLE notifications REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Each user sees only their own rows. Same custom-JWT-claim pattern as the
-- cart policy: our app JWT carries `userId` (not Supabase `sub`), set on the
-- socket via `realtime.setAuth()`.
DROP POLICY IF EXISTS notifications_own_rows ON notifications;
CREATE POLICY notifications_own_rows ON notifications
  FOR ALL TO anon, authenticated
  USING (user_id = (auth.jwt() ->> 'userId'))
  WITH CHECK (user_id = (auth.jwt() ->> 'userId'));

-- Read-only for the browser key. Writes (mark read / clear) stay in our API
-- routes (drizzle + pooler + custom JWT auth).
GRANT SELECT ON notifications TO anon, authenticated;

-- Post-run verification (expect 1 row each):
SELECT tablename FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
SELECT policyname, roles, cmd FROM pg_policies
  WHERE tablename = 'notifications';
