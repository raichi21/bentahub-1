-- ============================================================================
-- BentaHub GCash drawer fix: backfill missing session links
-- ============================================================================
-- RUN THIS MANUALLY in Supabase Dashboard → SQL Editor AFTER deploying the
-- code fix (GCash initiation now requires an open drawer session).
--
-- WHY: GCash transactions created before the fix carry `session_id = NULL`,
-- so the shift's GCash total can never see them. This links each one to the
-- drawer session that was open for the same cashier + branch at the time of
-- the sale (heuristic: opened_at <= sale < closed_at, latest window wins).
--
-- IDEMPOTENT — only touches rows still missing a session; safe to re-run.
-- Rows with no matching session window are LEFT ALONE and listed by the
-- verification query for manual review.
-- ============================================================================

UPDATE transactions t
SET session_id = s.id
FROM cash_drawer_sessions s
WHERE t.payment_method = 'gcash'
  AND t.status = 'completed'
  AND t.session_id IS NULL
  AND s.cashier_id = t.cashier_id
  AND s.branch_id = t.branch_id
  AND s.opened_at <= t.created_at
  AND (s.closed_at IS NULL OR t.created_at < s.closed_at)
  AND s.opened_at = (
    SELECT MAX(s2.opened_at)
    FROM cash_drawer_sessions s2
    WHERE s2.cashier_id = t.cashier_id
      AND s2.branch_id = t.branch_id
      AND s2.opened_at <= t.created_at
      AND (s2.closed_at IS NULL OR t.created_at < s2.closed_at)
  );

-- Verification 1: how many completed GCash rows still lack a session?
-- Expect 0; any remaining rows had no matching open session window.
SELECT count(*) AS still_missing_session
FROM transactions
WHERE payment_method = 'gcash'
  AND status = 'completed'
  AND session_id IS NULL;

-- Verification 2: the unmatched rows (if any) for manual review.
SELECT id, receipt_number, cashier_id, branch_id, total_amount, created_at
FROM transactions
WHERE payment_method = 'gcash'
  AND status = 'completed'
  AND session_id IS NULL
ORDER BY created_at DESC;
