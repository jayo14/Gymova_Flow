-- Ensure client_goals has safe, idempotent RLS for MVP matching.

ALTER TABLE IF EXISTS client_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY client_goals_own ON client_goals
    FOR ALL
    USING (auth.uid() = client_id)
    WITH CHECK (auth.uid() = client_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;
