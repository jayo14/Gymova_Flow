-- ============================================================
-- GymovaFlow – Remove "student" role, enforce 3-role system
-- Created: 2026-04-18
-- Roles going forward: admin | trainer | client
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Migrate any existing "student" rows → "client"
--    (safe to run even if no rows exist)
-- ────────────────────────────────────────────────────────────
UPDATE profiles
SET role = 'client'
WHERE role = 'student';

-- ────────────────────────────────────────────────────────────
-- 2. Add a CHECK constraint to prevent "student" ever being
--    written again.  We drop-if-exists first so the migration
--    is idempotent on re-runs.
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'trainer', 'client'));
