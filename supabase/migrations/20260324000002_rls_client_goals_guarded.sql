-- Ensure client_goals has safe, idempotent RLS for MVP matching.

DO $$
BEGIN
  IF to_regclass('public.client_goals') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS client_goals_own ON client_goals;

  CREATE POLICY client_goals_own ON client_goals
    USING (auth.uid() = client_id)
    WITH CHECK (auth.uid() = client_id);
END
$$;
